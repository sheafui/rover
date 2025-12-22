export default class ComboboxCollection {

    #items = []
    #itemsMap = new Map()

    #activeNavPos = -1

    #needsReindex = false;
    #navIndex = null;

    #searchIndex = null;
    #lastQuery = '';
    #lastResults = null;

    #isProcessing = false;

    constructor(options = {}, release = () => { }) {

        this.pending = Alpine.reactive({ state: false });

        this.activeIndex = Alpine.reactive({ value: null });

        this.searchThreshold = options.searchThreshold ?? 500
    }

    /* ----------------------------------------
     * Mutation
     * ------------------------------------- */

    add(key, value, disabled = false) {
        if (this.#itemsMap.has(key)) return

        const item = { key, value, disabled }

        this.#items.push(item)
        this.#itemsMap.set(key, item)

        this.#invalidate()
    }

    forget(key) {
        const item = this.#itemsMap.get(key)
        if (!item) return

        const index = this.#items.indexOf(item)

        this.#itemsMap.delete(key)
        this.#items.splice(index, 1)

        if (this.activeIndex.value === index) {
            this.activeIndex.value = null
            this.#activeNavPos = -1
        } else if (this.activeIndex.value > index) {
            this.activeIndex.value--
        }

        this.#invalidate()
    }

    /* ----------------------------------------
     * Activation
     * ------------------------------------- */

    activate(key) {

        const item = this.get(key)

        if (!item || item.disabled) return

        this.#rebuildIndexes()

        const index = this.#items.indexOf(item)

        if (this.activeIndex.value === index) return

        this.activeIndex.value = index

        this.#activeNavPos = this.#navIndex.indexOf(index)
    }

    deactivate() {
        this.activeIndex.value = null
        this.#activeNavPos = -1
    }

    isActivated(key) {

        const item = this.get(key)

        if (!item) return false

        return this.#items.indexOf(item) === this.activeIndex.value
    }

    getActiveItem() {
        return this.activeIndex.value === null
            ? null
            : this.#items[this.activeIndex.value]
    }

    /* ----------------------------------------
     * Keyboard navigation
     * ------------------------------------- */

    activateFirst() {
        this.#rebuildIndexes()
        if (!this.#navIndex.length) return
        this.activeIndex.value = this.#navIndex[0]
        this.#activeNavPos = 0
    }

    activateLast() {
        this.#rebuildIndexes()
        if (!this.#navIndex.length) return
        this.#activeNavPos = this.#navIndex.length - 1
        this.activeIndex.value = this.#navIndex[this.#activeNavPos]
    }

    activateNext() {
        this.#rebuildIndexes()
        if (!this.#navIndex.length) return

        if (this.#activeNavPos === -1) {
            this.activateFirst()
            return
        }

        this.#activeNavPos =
            (this.#activeNavPos + 1) % this.#navIndex.length

        this.activeIndex.value = this.#navIndex[this.#activeNavPos]
    }

    activatePrev() {
        this.#rebuildIndexes()
        if (!this.#navIndex.length) return

        if (this.#activeNavPos === -1) {
            this.activateLast()
            return
        }

        this.#activeNavPos =
            this.#activeNavPos === 0
                ? this.#navIndex.length - 1
                : this.#activeNavPos - 1

        this.activeIndex.value = this.#navIndex[this.#activeNavPos]
    }

    /* ----------------------------------------
     * Indexing
     * ------------------------------------- */

    #invalidate() {
        this.#needsReindex = true
        this.#lastQuery = ''
        this.#lastResults = null
        this.#scheduleBatch()
    }

    #scheduleBatch() {
        if (this.#isProcessing) return

        this.#isProcessing = true
        this.pending.state = true

        queueMicrotask(() => {
            this.#rebuildIndexes()
            this.#isProcessing = false
            this.pending.state = false
        })
    }

    toggleIsPending() {
        this.pending.state = !this.pending.state;
    }

    #rebuildIndexes() {
        if (!this.#needsReindex) return

        this.#navIndex = []
        for (let i = 0; i < this.#items.length; i++) {
            if (!this.#items[i].disabled) {
                this.#navIndex.push(i)
            }
        }

        if (this.#items.length >= this.searchThreshold) {
            this.#searchIndex = this.#items.map(item => ({
                key: item.key,
                value: String(item.value)
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
            }))
        } else {
            this.#searchIndex = null
        }

        this.#needsReindex = false
    }

    /* ----------------------------------------
     * Search
     * ------------------------------------- */

    search(query) {
        if (!query) {
            this.#lastQuery = ''
            this.#lastResults = null
            return this.#items
        }

        const q = query.toLowerCase()

        if (this.#lastQuery &&
            q.startsWith(this.#lastQuery) &&
            this.#lastResults) {

            const filtered = this.#lastResults.filter(item =>
                String(item.value).toLowerCase().includes(q)
            )

            this.#lastQuery = q
            this.#lastResults = filtered
            return filtered
        }

        let results

        if (this.#searchIndex) {
            const normalized = q
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')

            results = []
            for (const { key, value } of this.#searchIndex) {
                if (value.includes(normalized)) {
                    results.push(this.#itemsMap.get(key))
                }
            }
        } else {
            results = this.#items.filter(item =>
                String(item.value).toLowerCase().includes(q)
            )
        }

        this.#lastQuery = q
        this.#lastResults = results
        return results
    }

    /* ----------------------------------------
     * Queries
     * ------------------------------------- */

    get(key) {
        return this.#itemsMap.get(key)
    }

    getValueByKey(key) {

        // this.pending.state = true;

        // Wait for 500ms to mimic expensive work
        // await new Promise(resolve => setTimeout(resolve, 500));

        // this.pending.state = false;

        return this.get(key).value;
    }

    getElementByKey(key) {
        return this.get(key).el;
    }

    getKeyByIndex(index) {
        return index == null ? null : this.#items[index]?.key ?? null
    }

    all() {
        return this.#items
    }

    get size() {
        return this.#items.length
    }
}
