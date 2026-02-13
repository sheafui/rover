import type { Item, Options, Pending, ActiveIndex, SearchIndex } from "src/types";


export default class RoverCollection {

    private items: Array<Item> = [];
    private itemsMap = new Map<string, Item>();

    // Search state
    private searchIndex: SearchIndex[] = [];
    private currentQuery = '';
    private currentResults: Array<Item> = [];

    // Navigation state
    public navIndex: Array<number> = [];
    private activeNavPos: number = -1;
    public activeIndex: ActiveIndex;

    // Batch processing
    private needsReindex: boolean = false;
    private isProcessing = false;
    public pending: Pending;

    public searchThreshold: number;

    public constructor(options: Options = {}) {
        this.pending = Alpine.reactive<Pending>({ state: false });
        this.activeIndex = Alpine.reactive<ActiveIndex>({ value: undefined });
        this.searchThreshold = options.searchThreshold ?? 500;
    }

    /* ----------------------------------------
     * Collection Management
     * ------------------------------------- */

    public getMap() {
        return this.itemsMap;
    }

    public add(key: string, value: string, disabled = false): void {
        if (this.itemsMap.has(key)) return;

        const item = { key, value, disabled };

        this.items.push(item);
        this.itemsMap.set(key, item);

        this.invalidate();
    }

    public forget(key: string): void {
        const item = this.itemsMap.get(key);
        if (!item) return;

        const index = this.items.indexOf(item);

        this.itemsMap.delete(key);
        this.items.splice(index, 1);

        // Update active index if necessary
        if (this.activeIndex.value === index) {
            this.activeIndex.value = undefined;
            this.activeNavPos = -1;
        } else if (this.activeIndex.value !== undefined && this.activeIndex.value > index) {
            this.activeIndex.value--;
        }

        this.invalidate();
    }

    /* ----------------------------------------
     * Indexing
     * ------------------------------------- */

    private invalidate(): void {
        this.needsReindex = true;
        this.currentQuery = '';
        this.currentResults = [];
        this.scheduleBatch();
    }

    private scheduleBatch(): void {
        if (this.isProcessing) return;

        this.isProcessing = true;
        this.pending.state = true;

        queueMicrotask(() => {
            this.rebuildSearchIndex();
            this.rebuildNavIndex();
            this.isProcessing = false;
            this.pending.state = false;
        });
    }

    private rebuildSearchIndex(): void {
        if (!this.needsReindex) return;

        this.searchIndex = this.items.map((item) => ({
            key: item.key,
            value: String(item.value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        }));

        this.needsReindex = false;
    }

    private rebuildNavIndex(): void {
        this.navIndex = [];

        // Use search results if there's an active search, otherwise use all items
        const itemsToIndex = this.currentResults.length > 0 ? this.currentResults : this.items;

        for (let i = 0; i < this.items.length; i++) {
            if (!this.items[i]?.disabled && itemsToIndex.includes(this.items[i] as Item)) {
                this.navIndex.push(i);
            }
        }
    }

    public toggleIsPending(): void {
        this.pending.state = !this.pending.state;
    }

    /* ----------------------------------------
     * Search
     * ------------------------------------- */

    public search(query: string): Item[] {
        // Clear search
        if (!query) {
            this.currentQuery = '';
            this.currentResults = [];
            this.rebuildNavIndex();
            return this.items;
        }

        const q = query.toLowerCase();

        // Incremental search optimization
        if (this.currentQuery && q.startsWith(this.currentQuery) && this.currentResults.length > 0) {
            const filtered = this.currentResults.filter(item =>
                String(item.value).toLowerCase().includes(q)
            );

            this.currentQuery = q;
            this.currentResults = filtered;
            this.rebuildNavIndex();
            return filtered;
        }

        // Full search
        this.rebuildSearchIndex();

        const normalized = q.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const results: Item[] = [];

        for (const { key, value } of this.searchIndex) {
            if (value.includes(normalized)) {
                const item = this.itemsMap.get(key);
                if (item) results.push(item);
            }
        }

        this.currentQuery = q;
        this.currentResults = results;
        this.rebuildNavIndex();

        return results;
    }

    /* ----------------------------------------
     * Queries
     * ------------------------------------- */

    public get(key: string): Item | undefined {
        return this.itemsMap.get(key);
    }

    public getValueByKey(key: string): Item['value'] | undefined {
        return this.get(key)?.value;
    }

    public getKeyByIndex(index: number | null | undefined): string | null {
        if (index == null || index === undefined) return null;
        return this.items[index]?.key ?? null;
    }

    public all(): Item[] {
        return this.items;
    }

    public get size(): number {
        return this.items.length;
    }

    /* ----------------------------------------
     * Activation
     * ------------------------------------- */

    public activate(key: string): void {
        const item = this.get(key);
        if (!item || item.disabled) return;

        this.rebuildSearchIndex();
        this.rebuildNavIndex();

        const index = this.items.indexOf(item);
        if (this.activeIndex.value === index) return;

        this.activeIndex.value = index;
        this.activeNavPos = this.navIndex.indexOf(index);
    }

    public deactivate(): void {
        this.activeIndex.value = undefined;
        this.activeNavPos = -1;
    }

    public isActivated(key: string): boolean {
        const item = this.get(key);
        if (!item) return false;

        return this.items.indexOf(item) === this.activeIndex.value;
    }

    public getActiveItem(): Item | null {
        if (this.activeIndex.value === undefined) return null;
        return this.items[this.activeIndex.value] ?? null;
    }

    /* ----------------------------------------
     * Keyboard Navigation
     * ------------------------------------- */

    public activateFirst(): void {
        this.rebuildSearchIndex();
        this.rebuildNavIndex();

        if (!this.navIndex.length) return;

        const firstIndex = this.navIndex[0];
        if (firstIndex !== undefined) {
            this.activeIndex.value = firstIndex;
            this.activeNavPos = 0;
        }
    }

    public activateLast(): void {
        this.rebuildSearchIndex();
        this.rebuildNavIndex();

        if (!this.navIndex.length) return;

        this.activeNavPos = this.navIndex.length - 1;

        const lastIndex = this.navIndex[this.activeNavPos];
        if (typeof lastIndex === 'number') {
            this.activeIndex.value = lastIndex;
        }
    }

    public activateNext(): void {
        this.rebuildSearchIndex();
        this.rebuildNavIndex();

        if (!this.navIndex.length) return;

        if (this.activeNavPos === -1) {
            this.activateFirst();
            return;
        }

        this.activeNavPos = (this.activeNavPos + 1) % this.navIndex.length;
        const nextIndex = this.navIndex[this.activeNavPos];
        if (nextIndex !== undefined) {
            this.activeIndex.value = nextIndex;
        }
    }

    public activatePrev(): void {
        this.rebuildSearchIndex();
        this.rebuildNavIndex();

        if (!this.navIndex.length) return;

        if (this.activeNavPos === -1) {
            this.activateLast();
            return;
        }

        this.activeNavPos = this.activeNavPos === 0
            ? this.navIndex.length - 1
            : this.activeNavPos - 1;

        const prevIndex = this.navIndex[this.activeNavPos];
        if (prevIndex !== undefined) {
            this.activeIndex.value = prevIndex;
        }
    }
}