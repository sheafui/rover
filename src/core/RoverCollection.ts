import type { Item, Options, Pending, ActiveIndex } from "src/types";

export default class RoverCollection {
    // -----------------------
    // Core storage
    // -----------------------
    private itemsMap: Map<string, Item> = new Map();

    // -----------------------
    // Search state
    // -----------------------
    private currentQuery = '';
    private currentResults: Item[] = [];

    // -----------------------
    // Navigation
    // -----------------------
    public navIndex: string[] = [];          // array of value strings
    private activeNavPos: number = -1;       // position in navIndex
    public activatedValue; // canonical reactive

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

        if (this.currentQuery && this.currentResults.length) {
            const item = this.itemsMap.get(value)!;
            if (!disabled && item.searchable.includes(this.currentQuery)) {
                this.currentResults.push(item);
            }
        }

        this._markDirty();
    }

    public forget(value: string): void {
        const item = this.itemsMap.get(value);
        if (!item) return;

        this.itemsMap.delete(value);

        const idx = this.currentResults.indexOf(item);
        if (idx !== -1) this.currentResults.splice(idx, 1);

        if (this.activatedValue.value === value) {
            this.activatedValue.value = null;
            this.activeNavPos = -1;
        }

        this._markDirty();
    }

    // -----------------------
    // Search
    // -----------------------
    private static _normalize(s: string) {
        return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    public search(query: string): Item[] {
        if (!query) {
            this.currentQuery = '';
            this.currentResults = [];
            this._markDirty();
            return Array.from(this.itemsMap.values());
        }

        const normalizedQuery = RoverCollection._normalize(query);

        const source = this.currentQuery &&
            normalizedQuery.startsWith(this.currentQuery) &&
            this.currentResults.length
            ? this.currentResults
            : Array.from(this.itemsMap.values());

        const prefix: Item[] = [];
        const mid: Item[] = [];

        for (const item of source) {
            const s = item.searchable;
            if (s.startsWith(normalizedQuery)) prefix.push(item);
            else if (s.includes(normalizedQuery)) mid.push(item);
        }

        this.currentQuery = normalizedQuery;
        this.currentResults = prefix.concat(mid);
        this._markDirty();

        return this.currentResults;
    }

    // -----------------------
    // Lookup
    // -----------------------
    public get(value: string): Item | undefined {
        return this.itemsMap.get(value);
    }

    public getActiveItem(): Item | null {
        return this.activatedValue.value ? this.itemsMap.get(this.activatedValue.value) ?? null : null;
    }

    public all(): Item[] {
        return Array.from(this.itemsMap.values());
    }

    public get size(): number {
        return this.itemsMap.size;
    }

    // -----------------------
    // NavIndex Lazy Build
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

        const source = this.currentResults.length ? this.currentResults : Array.from(this.itemsMap.values());

        this.navIndex = source.filter(i => !i.disabled).map(i => i.value);

        if (this.activatedValue.value) {
            const pos = this.navIndex.indexOf(this.activatedValue.value);
            this.activeNavPos = pos;
            if (pos === -1) this.activatedValue.value = null;
        } else {
            this.activeNavPos = -1;
        }
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
        this.activeNavPos = this.navIndex.indexOf(value);
    }

    public deactivate(): void {
        this.activatedValue.value = null;
        this.activeNavPos = -1;
    }

    public isActivated(value: string): boolean {
        return this.activatedValue.value === value;
    }

    // -----------------------
    // Keyboard Navigation
    // -----------------------
    private setActiveByNavPos(): void {
        const value = this.navIndex[this.activeNavPos];
        if (!value) return;
        this.activatedValue.value = value;
    }

    public activateFirst(): void {
        this._ensureNavIndex();
        if (!this.navIndex.length) return;
        this.activeNavPos = 0;
        this.setActiveByNavPos();
    }

    public activateLast(): void {
        this._ensureNavIndex();
        if (!this.navIndex.length) return;
        this.activeNavPos = this.navIndex.length - 1;
        this.setActiveByNavPos();
    }

    public activateNext(): void {
        this._ensureNavIndex();
        if (!this.navIndex.length) return;
        if (this.activeNavPos === -1) return this.activateFirst();
        this.activeNavPos = (this.activeNavPos + 1) % this.navIndex.length;
        this.setActiveByNavPos();
    }

    public activatePrev(): void {
        this._ensureNavIndex();
        if (!this.navIndex.length) return;
        if (this.activeNavPos === -1) return this.activateLast();
        this.activeNavPos = this.activeNavPos === 0 ? this.navIndex.length - 1 : this.activeNavPos - 1;
        this.setActiveByNavPos();
    }

    // -----------------------
    // Type-ahead
    // -----------------------
    public activateByKey(key: string): void {
        this._ensureNavIndex();

        this.typedBuffer += key.toLowerCase();
        if (this.bufferResetTimeout) clearTimeout(this.bufferResetTimeout);
        this.bufferResetTimeout = setTimeout(() => (this.typedBuffer = ''), this.bufferDelay);

        const source = this.currentResults.length ? this.currentResults : Array.from(this.itemsMap.values());
        const start = this.activatedValue.value ? this.navIndex.indexOf(this.activatedValue.value) + 1 : 0;

        const total = source.length;
        for (let i = 0; i < total; i++) {
            const item = source[(start + i) % total];

            if (item && !item.disabled && item.searchable.startsWith(this.typedBuffer)) {
                this.activate(item.value);
                break;
            }
        }
    }
}

