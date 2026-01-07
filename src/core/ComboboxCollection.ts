import type { Item, Options, Pending, ActiveIndex, SearchIndex } from "src/types";


export default class ComboboxCollection {

    private items: Array<Item> = [];
    private itemsMap = new Map<string, Item>()

    private activeNavPos: number = -1;

    private needsReindex: boolean = false;

    private navIndex: Array<number> = [];

    private searchIndex: SearchIndex[];
    private lastQuery = '';
    private lastResults: Array<Item>;

    private isProcessing = false;

    public pending: Pending;

    public activeIndex: ActiveIndex;

    public searchThreshold: number;

    public constructor(options: Options = {}) {

        this.pending = Alpine.reactive<Pending>({ state: false });

        this.activeIndex = Alpine.reactive<ActiveIndex>({ value: undefined });

        this.searchThreshold = options.searchThreshold ?? 500;
    }

    public add(key: string, value: string, disabled = false): void {

        if (this.itemsMap.has(key)) return

        const item = { key, value, disabled }

        this.items.push(item)

        this.itemsMap.set(key, item)

        this.invalidate()
    }

    public forget(key: string): void {

        const item = this.itemsMap.get(key);

        if (!item) return;

        const index = this.items.indexOf(item);

        this.itemsMap.delete(key);
        this.items.splice(index, 1);

        if (this.activeIndex.value === index) {
            this.activeIndex.value = undefined;
            this.activeNavPos = -1;
        } else if (this.activeIndex.value && this.activeIndex.value > index) {
            this.activeIndex.value--;
        }

        this.invalidate()
    }

    /* ----------------------------------------
     * Activation
     * ------------------------------------- */

    activate(key: string) {

        const item = this.get(key)

        if (!item || item.disabled) return

        this.rebuildIndexes()

        const index = this.items.indexOf(item)

        if (this.activeIndex.value === index) return

        this.activeIndex.value = index

        this.activeNavPos = this.navIndex.indexOf(index)
    }

    deactivate() {
        this.activeIndex.value = undefined;
        this.activeNavPos = -1;
    }

    isActivated(key: string) {

        const item = this.get(key);

        if (!item) return false;

        return this.items.indexOf(item) === this.activeIndex.value;
    }

    getActiveItem() {
        return this.activeIndex.value === undefined ? null : this.items[this.activeIndex.value]
    }

    /* ----------------------------------------
     * Keyboard navigation
     * ------------------------------------- */

    activateFirst() {
        this.rebuildIndexes()

        if (!this.navIndex.length) return;

        if (this.navIndex[0]) {
            this.activeIndex.value = this.navIndex[0];
        }

        this.activeNavPos = 0;
    }

    activateLast() {
        this.rebuildIndexes()

        if (!this.navIndex.length) return

        this.activeNavPos = this.navIndex.length - 1

        const activeIndex = this.navIndex[this.activeNavPos];

        if (typeof activeIndex === 'number') {
            this.activeIndex.value = activeIndex;
        }
    }

    activateNext() {

        this.rebuildIndexes();

        if (!this.navIndex.length) return;

        if (this.activeNavPos === -1) {
            this.activateFirst();
            return;
        }

        this.activeNavPos = (this.activeNavPos + 1) % this.navIndex.length

        this.activeIndex.value = this.navIndex[this.activeNavPos]
    }

    activatePrev() {
        this.rebuildIndexes()
        if (!this.navIndex.length) return

        if (this.activeNavPos === -1) {
            this.activateLast()
            return
        }

        this.activeNavPos =
            this.activeNavPos === 0
                ? this.navIndex.length - 1
                : this.activeNavPos - 1

        this.activeIndex.value = this.navIndex[this.activeNavPos]
    }

    /* ----------------------------------------
     * Indexing
     * ------------------------------------- */

    private invalidate() {
        this.needsReindex = true;
        this.lastQuery = '';
        this.lastResults = [];
        this.scheduleBatch();
    }

    private scheduleBatch() {
        if (this.isProcessing) return

        this.isProcessing = true
        this.pending.state = true

        queueMicrotask(() => {
            this.rebuildIndexes()
            this.isProcessing = false
            this.pending.state = false
        })
    }

    toggleIsPending() {
        this.pending.state = !this.pending.state;
    }

    private rebuildIndexes() {
        if (!this.needsReindex) return

        this.navIndex = [];

        console.log('called');

        for (let i = 0; i < this.items.length; i++) {
            if (!this.items[i]?.disabled) {
                this.navIndex.push(i)
            }
        }

        this.searchIndex = this.items.map(item => ({
            key: item.key,
            value: String(item.value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        }))

        this.needsReindex = false
    }

    /* ----------------------------------------
     * Search
     * ------------------------------------- */

    search(query: string): Item[] {

        if (!query) {
            this.lastQuery = ''
            this.lastResults = []
            return this.items
        }

        const q = query.toLowerCase()

        if (this.lastQuery && q.startsWith(this.lastQuery) && this.lastResults) {

            const filtered = this.lastResults.filter(item =>
                String(item.value).toLowerCase().includes(q)
            )

            this.lastQuery = q
            this.lastResults = filtered
            return filtered
        }

        let results: Item[];

        if (this.searchIndex) {
            const normalized = q.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

            results = [];
            console.log('inside search index', this.searchIndex);
            for (const { key, value } of this.searchIndex) {
                if (value.includes(normalized)) {

                    const item = this.itemsMap.get(key);

                    if (item) results.push(item);
                }
            }

        } else {
            results = this.items.filter(item =>
                String(item.value).toLowerCase().includes(q)
            );
        }

        this.lastQuery = q;

        this.lastResults = results;

        return results;
    }

    /* ----------------------------------------
     * Queries
     * ------------------------------------- */

    get(key: string): Item | undefined {
        return this.itemsMap.get(key)
    }

    getValueByKey(key: string): Item['value'] | undefined {

        return this.get(key)?.value;
    }

    getKeyByIndex(index: number | null | undefined) {
        return index == null ? null : this.items[index]?.key ?? null
    }

    all() {
        return this.items
    }

    get size() {
        return this.items.length
    }
}
