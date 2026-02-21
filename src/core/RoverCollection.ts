import type { Item, Options, Pending } from "src/types";

export default class RoverCollection {

    // -----------------------
    // Core storage
    // -----------------------
    private itemsMap: Map<string, Item> = new Map();

    /**
     * Tracks DOM insertion order separately from the Map.
     * Maps don't guarantee stable order across delete+re-add cycles —
     * morphdom forget → add pushes the item to the end of Map iteration.
     * This array is the canonical order for nav traversal.
     */
    private _insertionOrder: string[] = [];

    // -----------------------
    // Search state
    // -----------------------
    private currentQuery = '';
    private currentResults: Item[] = [];

    // -----------------------
    // Navigation
    // -----------------------

    /**
     * Ordered list of navigable value strings:
     * - respects _insertionOrder (not Map iteration order)
     * - excludes disabled items
     * - filtered to currentResults when a search is active
     */
    public navIndex: string[] = [];

    /**
     * O(1) reverse lookup: value → position in navIndex.
     * Rebuilt alongside navIndex. Eliminates indexOf on every arrow key.
     */
    private _navPosMap: Map<string, number> = new Map();

    public activatedValue: { value: string | null };

    // -----------------------
    // Batch / dirty flag
    // -----------------------
    private _navDirty = false;
    private _flushQueued = false;

    // -----------------------
    // Type-ahead
    // -----------------------
    private typedBuffer = '';
    private bufferResetTimeout: ReturnType<typeof setTimeout> | null = null;
    private bufferDelay = 500;

    // -----------------------
    // Reactive flags
    // -----------------------
    public pending: Pending;
    public searchThreshold: number;

    constructor(options: Options) {
        this.pending = Alpine.reactive<Pending>({ value: false });
        this.activatedValue = Alpine.reactive<{ value: string | null }>({ value: null });
        this.searchThreshold = options.searchThreshold ?? 500;
    }

    // -----------------------
    // Add / Forget
    // -----------------------

    public add(value: string, searchable: string, disabled = false): void {
        if (this.itemsMap.has(value)) return;

        this.itemsMap.set(value, { value, searchable, disabled });

        this._insertionOrder.push(value);

        this._markDirty();
        console.log('from add', this.itemsMap);
    }

    public forget(value: string): void {
        const item = this.itemsMap.get(value);
        if (!item) return;

        this.itemsMap.delete(value);

        const oi = this._insertionOrder.indexOf(value);
        if (oi !== -1) this._insertionOrder.splice(oi, 1);

        const ri = this.currentResults.indexOf(item);
        if (ri !== -1) this.currentResults.splice(ri, 1);

        if (this.activatedValue.value === value) {
            this.activatedValue.value = null;
        }

        this._markDirty();

        console.log('from add', this.itemsMap);
    }

    // -----------------------
    // Search
    // -----------------------

    /**
     * Normalizes raw user query input.
     * Item searchable strings are already normalized upstream in CreateRoverOption
     * and are never re-normalized here.
     */
    public static _normalize(s: string): string {
        const lower = s.toLowerCase();
        // Skip NFD normalization if no non-ASCII characters present —
        // avoids the most expensive part of the chain for typical Latin input.
        if (!/[^\u0000-\u007f]/.test(lower)) return lower;
        return lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    /**
     * Two-pass substring search:
     *   Pass 1 — prefix matches (searchable starts with query) → ranked first
     *   Pass 2 — mid-string matches (searchable contains query)
     * Single loop, two buckets, one concat. No sort pass needed.
     */
    public search(query: string): Item[] {

        const normalizedQuery = RoverCollection._normalize(query);

        // Narrowing optimisation: if the new query extends the previous one,
        // filter only the existing (smaller) result set instead of all items.
        const narrowNewFilterToPreviousResultsSet = this.currentQuery && normalizedQuery.startsWith(this.currentQuery) && this.currentResults.length;

        const source: Item[] = narrowNewFilterToPreviousResultsSet ? this.currentResults : Array.from(this.itemsMap.values());

        const prefix: Item[] = [];
        const mid: Item[] = [];

        for (const item of source) {
            const s = item.searchable;
            if (s.startsWith(normalizedQuery)) prefix.push(item);
            else if (s.includes(normalizedQuery)) mid.push(item);
        }

        this.currentQuery = normalizedQuery;
        this.currentResults = prefix.length || mid.length ? prefix.concat(mid) : [];
        this._markDirty();

        return this.currentResults;
    }

    public reset(): void {
        this.currentQuery = '';
        this.currentResults = [];
        this._markDirty();
    }

    // -----------------------
    // Lookup
    // -----------------------

    public get(value: string): Item | undefined {
        return this.itemsMap.get(value);
    }

    public getActiveItem(): Item | null {
        return this.activatedValue.value
            ? this.itemsMap.get(this.activatedValue.value) ?? null
            : null;
    }

    public all(): Item[] {
        // Return items in stable insertion order, not Map iteration order.
        return this._insertionOrder.map(v => this.itemsMap.get(v)!);
    }

    public get size(): number {
        return this.itemsMap.size;
    }

    // -----------------------
    // NavIndex — lazy build
    // -----------------------

    private _markDirty(): void {
        this._navDirty = true;
        if (!this._flushQueued) {
            this._flushQueued = true;

            queueMicrotask(() => {
                this._flushQueued = false;
                if (this._navDirty) this._rebuildNavIndex();
            });
        }
    }

    private _ensureNavIndex(): void {
        if (this._navDirty) this._rebuildNavIndex();
    }

    private _rebuildNavIndex(): void {
        this._navDirty = false;

        // Use _insertionOrder as the traversal base so nav order always
        // matches DOM order, even after morphdom forget → add cycles.
        const resultSet: Set<Item> | null = this.currentResults.length
            ? new Set(this.currentResults)
            : null;

        const next: string[] = [];

        for (const value of this._insertionOrder) {
            const item = this.itemsMap.get(value);
            if (!item || item.disabled) continue;
            if (resultSet !== null && !resultSet.has(item)) continue;
            next.push(value);
        }

        this.navIndex = next;

        // Rebuild the O(1) position lookup alongside navIndex.
        this._navPosMap = new Map(next.map((v, i) => [v, i]));
    }

    // -----------------------
    // Activation
    // -----------------------

    public activate(value: string): void {
        this._ensureNavIndex();
        const item = this.itemsMap.get(value);
        if (!item || item.disabled) return;
        if (this.activatedValue.value === value) return;
        this.activatedValue.value = value;
    }

    public deactivate(): void {
        this.activatedValue.value = null;
    }

    public isActivated(value: string): boolean {
        return this.activatedValue.value === value;
    }

    // -----------------------
    // Keyboard Navigation
    // -----------------------

    private _setActiveByIndex(index: number): void {
        const value = this.navIndex[index];
        if (value !== undefined) this.activatedValue.value = value;
    }

    public activateFirst(): void {
        this._ensureNavIndex();
        if (!this.navIndex.length) return;
        this._setActiveByIndex(0);
    }

    public activateLast(): void {
        this._ensureNavIndex();
        if (!this.navIndex.length) return;
        this._setActiveByIndex(this.navIndex.length - 1);
    }

    public activateNext(): void {
        this._ensureNavIndex();
        if (!this.navIndex.length) return;

        const current = this.activatedValue.value !== null
            ? (this._navPosMap.get(this.activatedValue.value) ?? -1)
            : -1;

        this._setActiveByIndex(current === -1 ? 0 : (current + 1) % this.navIndex.length);
    }

    public activatePrev(): void {
        this._ensureNavIndex();
        if (!this.navIndex.length) return;

        const current = this.activatedValue.value !== null
            ? (this._navPosMap.get(this.activatedValue.value) ?? -1)
            : -1;

        this._setActiveByIndex(current <= 0 ? this.navIndex.length - 1 : current - 1);
    }

    // -----------------------
    // Type-ahead
    // -----------------------

    public activateByKey(key: string): void {
        this._ensureNavIndex();

        this.typedBuffer += key.toLowerCase();
        if (this.bufferResetTimeout) clearTimeout(this.bufferResetTimeout);
        this.bufferResetTimeout = setTimeout(() => (this.typedBuffer = ''), this.bufferDelay);

        if (!this.navIndex.length) return;

        const currentPos = this.activatedValue.value !== null
            ? (this._navPosMap.get(this.activatedValue.value) ?? -1)
            : -1;

        const startIndex = currentPos === -1 ? 0 : (currentPos + 1) % this.navIndex.length;
        const total = this.navIndex.length;

        for (let i = 0; i < total; i++) {
            const value = this.navIndex[(startIndex + i) % total]!;
            const item = this.itemsMap.get(value);
            if (item && item.searchable.startsWith(this.typedBuffer)) {
                this.activatedValue.value = value;
                break;
            }
        }
    }
}