import type { Item, Options, Pending, ActiveIndex } from "src/types";

export default class RoverCollection {

    private items: Array<Item> = [];

    // Search state
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

    private typedBuffer = '';
    private bufferResetTimeout: ReturnType<typeof setTimeout> | null = null;
    private bufferDelay = 1500;

    public searchThreshold: number;

    public constructor(options: Options = {}) {
        this.pending = Alpine.reactive<Pending>({ state: false });
        this.activeIndex = Alpine.reactive<ActiveIndex>({ value: undefined });
        this.searchThreshold = options.searchThreshold ?? 500;
    }

    /* ----------------------------------------
     * Collection Management
     * ------------------------------------- */

    public add(value: string, searchable: string, disabled = false): void {
        const item = { value, disabled, searchable };
        this.items.push(item);
        this.invalidate();
    }

    public forget(value: string): void {
        const index = this.items.findIndex(item => item.value === value);

        if (index === -1) return;

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
        this.scheduleBatchAsANextMicroTask();
    }

    private scheduleBatchAsANextMicroTask(): void {
        if (this.isProcessing) return;

        this.isProcessing = true;
        this.pending.state = true;

        queueMicrotask(() => {
            this.rebuildNavIndex();
            this.isProcessing = false;
            this.pending.state = false;
        });
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
        if (query === '') {
            this.currentQuery = '';
            this.currentResults = [];
            this.rebuildNavIndex();
            return this.items;
        }

        const normalizedQuery = query
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

        // Incremental search optimization
        if (this.currentQuery && normalizedQuery.startsWith(this.currentQuery) && this.currentResults.length > 0) {
            const filtered = this.currentResults.filter(item => {
                return item.searchable.includes(normalizedQuery);
            });

            this.currentQuery = normalizedQuery;
            this.currentResults = filtered;
            this.rebuildNavIndex();
            return filtered;
        }

        // Full search - search items directly
        const results = this.items.filter(item => {
            return item.searchable.includes(normalizedQuery);
        });

        this.currentQuery = normalizedQuery;
        this.currentResults = results;
        this.rebuildNavIndex();

        return results;
    }

    /* ----------------------------------------
     * Queries
     * ------------------------------------- */

    public get(value: string): Item | undefined {
        return this.items.find(item => item.value === value);
    }

    public getByIndex(index: number | null | undefined): Item | null {
        if (index == null || index === undefined) return null;
        return this.items[index] ?? null;
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

    public activate(value: string): void {
        const index = this.items.findIndex(item => item.value === value);
        if (index === -1) return;

        const item = this.items[index];
        if (item?.disabled) return;

        this.rebuildNavIndex();

        if (this.activeIndex.value === index) return;

        this.activeIndex.value = index;
        this.activeNavPos = this.navIndex.indexOf(index);
    }

    public deactivate(): void {
        this.activeIndex.value = undefined;
        this.activeNavPos = -1;
    }

    public isActivated(value: string): boolean {
        const index = this.items.findIndex(item => item.value === value);
        if (index === -1) return false;

        return index === this.activeIndex.value;
    }

    public getActiveItem(): Item | null {
        if (this.activeIndex.value === undefined) return null;
        return this.items[this.activeIndex.value] ?? null;
    }

    /* ----------------------------------------
     * Keyboard Navigation
     * ------------------------------------- */

    public activateFirst(): void {
        this.rebuildNavIndex();

        if (!this.navIndex.length) return;

        const firstIndex = this.navIndex[0];
        if (firstIndex !== undefined) {
            this.activeIndex.value = firstIndex;
            this.activeNavPos = 0;
        }
    }

    public activateLast(): void {
        this.rebuildNavIndex();

        if (!this.navIndex.length) return;

        this.activeNavPos = this.navIndex.length - 1;

        const lastIndex = this.navIndex[this.activeNavPos];
        if (typeof lastIndex === 'number') {
            this.activeIndex.value = lastIndex;
        }
    }

    public activateNext(): void {
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

    public activateByKey(key: string): void {
        if (!/^[a-zA-Z0-9]$/.test(key)) return;

        const normalizedKey = key.toLowerCase();

        this.typedBuffer += normalizedKey;

        if (this.bufferResetTimeout) clearTimeout(this.bufferResetTimeout);

        this.bufferResetTimeout = setTimeout(() => {
            this.typedBuffer = '';
        }, this.bufferDelay);

        const searchItems = this.currentResults.length > 0 ? this.currentResults : this.items;
        const startIndex = this.activeIndex.value !== undefined ? this.activeIndex.value + 1 : 0;
        const total = searchItems.length;

        for (let i = 0; i < total; i++) {
            const index = (startIndex + i) % total;
            const item = searchItems[index];
            if (!item?.disabled && item?.value.toLowerCase().startsWith(this.typedBuffer)) {
                this.activate(item.value);
                break;
            }
        }
    }


}