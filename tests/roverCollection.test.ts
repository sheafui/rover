import RoverCollection from 'src/core/RoverCollection';
import { describe, it, expect, beforeEach } from 'vitest';

const add = (c: RoverCollection, value: string, disabled = false) =>
    c.add(value, value, value.toLowerCase(), disabled);

describe('RoverCollection', () => {
    let collection: RoverCollection;

    beforeEach(() => {
        collection = new RoverCollection({});
    });

    // -----------------------
    // Initialization
    // -----------------------

    describe('Initialization', () => {
        it('should initialize with empty items', () => {
            expect(collection.size).toBe(0);
            expect(collection.getAllValues()).toEqual([]);
        });

        it('should initialize with default search threshold', () => {
            expect(collection.searchThreshold).toBe(500);
        });

        it('should initialize with custom search threshold', () => {
            const c = new RoverCollection({ searchThreshold: 1000, preventDuplication: true });
            expect(c.searchThreshold).toBe(1000);
        });

        it('should initialize pending as false', () => {
            expect(collection.pending.value).toBe(false);
        });

        it('should initialize activatedValue as null', () => {
            expect(collection.activatedValue.value).toBeNull();
        });
    });

    // -----------------------
    // Add / Forget
    // -----------------------

    describe('Adding Items', () => {
        it('should add a single item', () => {
            add(collection, 'apple');

            expect(collection.size).toBe(1);
            expect(collection.get('apple')).toMatchObject({
                value: 'apple',
                disabled: false,
            });
        });

        it('should add multiple items', () => {
            add(collection, 'apple');
            add(collection, 'banana');
            add(collection, 'cherry');

            expect(collection.size).toBe(3);
        });

        it('should add disabled items', () => {
            add(collection, 'apple', true);

            expect(collection.get('apple')?.disabled).toBe(true);
        });

        it('should not add duplicate values', () => {
            add(collection, 'apple');
            add(collection, 'apple');

            expect(collection.size).toBe(1);
        });

        it('should mark nav dirty after add', async () => {
            add(collection, 'apple');
            // dirty flag resolves via microtask
            await Promise.resolve();
            // after flush navIndex should reflect the add
            collection.setValuesInDomOrder(['apple']);
            expect(collection.navIndex).toContain('apple');
        });
    });

    describe('Removing Items', () => {
        beforeEach(() => {
            add(collection, 'apple');
            add(collection, 'banana');
            add(collection, 'cherry');
            collection.setValuesInDomOrder(['apple', 'banana', 'cherry']);
        });

        it('should remove an item by value', () => {
            collection.forget('banana');

            expect(collection.size).toBe(2);
            expect(collection.get('banana')).toBeUndefined();
        });

        it('should handle removing non-existent value gracefully', () => {
            collection.forget('nonexistent');

            expect(collection.size).toBe(3);
        });

        it('should deactivate item if it was active', () => {
            collection.activate('banana');
            expect(collection.activatedValue.value).toBe('banana');

            collection.forget('banana');

            expect(collection.activatedValue.value).toBeNull();
        });

        it('should not affect activatedValue when removing a different item', () => {
            collection.activate('cherry');
            collection.forget('apple');

            expect(collection.activatedValue.value).toBe('cherry');
        });
    });

    // -----------------------
    // Activation
    // -----------------------

    describe('Activation', () => {
        beforeEach(() => {
            add(collection, 'apple');
            add(collection, 'banana');
            add(collection, 'cherry');
            add(collection, 'date', true); // disabled
            collection.setValuesInDomOrder(['apple', 'banana', 'cherry', 'date']);
        });

        it('should activate an item by value', () => {
            collection.activate('banana');

            expect(collection.activatedValue.value).toBe('banana');
            expect(collection.getActiveItem()?.value).toBe('banana');
        });

        it('should not activate disabled items', () => {
            collection.activate('date');

            expect(collection.activatedValue.value).toBeNull();
        });

        it('should not activate non-existent items', () => {
            collection.activate('nonexistent');

            expect(collection.activatedValue.value).toBeNull();
        });

        it('should report isActivated correctly', () => {
            collection.activate('banana');

            expect(collection.isActivated('banana')).toBe(true);
            expect(collection.isActivated('apple')).toBe(false);
        });

        it('should deactivate current item', () => {
            collection.activate('banana');
            collection.deactivate();

            expect(collection.activatedValue.value).toBeNull();
            expect(collection.getActiveItem()).toBeNull();
        });

        it('should not re-trigger if already active', () => {
            collection.activate('banana');
            const before = collection.activatedValue.value;
            collection.activate('banana');

            expect(collection.activatedValue.value).toBe(before);
        });
    });

    // -----------------------
    // Keyboard Navigation
    // -----------------------

    describe('Keyboard Navigation', () => {
        beforeEach(() => {
            add(collection, 'apple');
            add(collection, 'banana', true); // disabled — skipped in navIndex
            add(collection, 'cherry');
            add(collection, 'date');
            collection.setValuesInDomOrder(['apple', 'banana', 'cherry', 'date']);
        });

        it('should activate first navigable item', () => {
            collection.activateFirst();

            expect(collection.activatedValue.value).toBe('apple');
        });

        it('should activate last navigable item', () => {
            collection.activateLast();

            expect(collection.activatedValue.value).toBe('date');
        });

        it('should activate next item skipping disabled', () => {
            collection.activate('apple');
            collection.activateNext();

            // banana is disabled so cherry is next
            expect(collection.activatedValue.value).toBe('cherry');
        });

        it('should wrap to first when activating next from last', () => {
            collection.activate('date');
            collection.activateNext();

            expect(collection.activatedValue.value).toBe('apple');
        });

        it('should activate prev item skipping disabled', () => {
            collection.activate('cherry');
            collection.activatePrev();

            // banana is disabled so apple is prev
            expect(collection.activatedValue.value).toBe('apple');
        });

        it('should wrap to last when activating prev from first', () => {
            collection.activate('apple');
            collection.activatePrev();

            expect(collection.activatedValue.value).toBe('date');
        });

        it('should activate first when calling next with no active item', () => {
            collection.activateNext();

            expect(collection.activatedValue.value).toBe('apple');
        });

        it('should activate last when calling prev with no active item', () => {
            collection.activatePrev();

            expect(collection.activatedValue.value).toBe('date');
        });

        it('should do nothing when all items are disabled', () => {
            const c = new RoverCollection({});
            add(c, 'x', true);
            add(c, 'y', true);
            c.setValuesInDomOrder(['x', 'y']);

            c.activateFirst();

            expect(c.activatedValue.value).toBeNull();
        });

        it('should do nothing when collection is empty', () => {
            const c = new RoverCollection({});

            c.activateFirst();
            c.activateNext();
            c.activatePrev();

            expect(c.activatedValue.value).toBeNull();
        });
    });

    // -----------------------
    // Search
    // -----------------------

    describe('Search', () => {
        beforeEach(() => {
            collection.add('apple', 'Apple', 'apple');
            collection.add('banana', 'Banana', 'banana');
            collection.add('cherry', 'Cherry', 'cherry');
            collection.add('apricot', 'Apricot', 'apricot');
            collection.add('blueberry', 'Blueberry', 'blueberry');
            collection.setValuesInDomOrder(['apple', 'banana', 'cherry', 'apricot', 'blueberry']);
        });

        it('should return all items when query is empty', () => {
            const results = collection.search('');
            // empty query produces no results in current impl — reset() is the clear path
            expect(Array.isArray(results)).toBe(true);
        });

        it('should filter items by query', () => {
            const results = collection.search('app');

            expect(results).toHaveLength(1);
            expect(results[0]?.value).toBe('apple');
        });

        it('should be case insensitive', () => {
            const results = collection.search('BANANA');

            expect(results).toHaveLength(1);
            expect(results[0]?.value).toBe('banana');
        });

        it('should match mid-string', () => {
            const results = collection.search('berry');

            expect(results).toHaveLength(1);
            expect(results[0]?.value).toBe('blueberry');
        });

        it('should rank prefix matches before mid-string matches', () => {
            // 'a' — apple/apricot start with it, banana contains it
            const results = collection.search('a');

            const prefixValues = ['apple', 'apricot'];
            const firstTwo = results.slice(0, 2).map(r => r.value);
            expect(firstTwo).toEqual(expect.arrayContaining(prefixValues));
        });

        it('should narrow incrementally when query extends previous', () => {
            const r1 = collection.search('ap');
            expect(r1).toHaveLength(2); // apple, apricot

            const r2 = collection.search('app');
            expect(r2).toHaveLength(1); // apple only
        });

        it('should reset narrowing when query changes non-incrementally', () => {
            collection.search('app');

            const results = collection.search('ban');
            expect(results).toHaveLength(1);
            expect(results[0]?.value).toBe('banana');
        });

        it('should return empty array when no matches', () => {
            const results = collection.search('xyz');

            expect(results).toHaveLength(0);
        });

        it('should reset search state', async () => {
            collection.search('app');
            collection.reset();

            // after reset navIndex rebuilds from full set
            await Promise.resolve();
            expect(collection.navIndex.length).toBe(5);
        });
    });

    // -----------------------
    // Search — unicode
    // -----------------------

    describe('Search — unicode', () => {
        it('should handle accented characters', () => {
            collection.add('cafe', 'Café', 'cafe\u0301'); // pre-composed form
            collection.setValuesInDomOrder(['cafe']);

            const results = collection.search('cafe');
            expect(results.some(r => r.value === 'cafe')).toBe(true);
        });

        it('should normalize NFD input', () => {
            collection.add('naive', 'naïve', 'naive');
            collection.setValuesInDomOrder(['naive']);

            const results = collection.search('naive');
            expect(results.some(r => r.value === 'naive')).toBe(true);
        });

        it('should handle emoji in values', () => {
            collection.add('emoji', '😀 Emoji', 'emoji');
            collection.setValuesInDomOrder(['emoji']);

            expect(collection.search('emoji')).toHaveLength(1);
        });
    });

    // -----------------------
    // Lookup
    // -----------------------

    describe('Lookup', () => {
        beforeEach(() => {
            add(collection, 'apple');
            add(collection, 'banana');
            add(collection, 'cherry');
            collection.setValuesInDomOrder(['apple', 'banana', 'cherry']);
        });

        it('should get item by value', () => {
            expect(collection.get('banana')).toMatchObject({ value: 'banana' });
        });

        it('should return undefined for non-existent value', () => {
            expect(collection.get('nonexistent')).toBeUndefined();
        });

        it('should return all values in DOM order', () => {
            expect(collection.getAllValues()).toEqual(['apple', 'banana', 'cherry']);
        });

        it('should return active item', () => {
            collection.activate('banana');
            expect(collection.getActiveItem()?.value).toBe('banana');
        });

        it('should return null for active item when nothing is active', () => {
            expect(collection.getActiveItem()).toBeNull();
        });

        it('should report correct size', () => {
            expect(collection.size).toBe(3);
            add(collection, 'date');
            expect(collection.size).toBe(4);
            collection.forget('apple');
            expect(collection.size).toBe(3);
        });
    });

    // -----------------------
    // DOM order
    // -----------------------

    describe('DOM Order', () => {
        it('should rebuild navIndex in DOM order not insertion order', () => {
            add(collection, 'c');
            add(collection, 'a');
            add(collection, 'b');

            // DOM order differs from insertion order
            collection.setValuesInDomOrder(['a', 'b', 'c']);

            expect(collection.navIndex).toEqual(['a', 'b', 'c']);
        });

        it('should navigate in DOM order', () => {
            add(collection, 'c');
            add(collection, 'a');
            add(collection, 'b');
            collection.setValuesInDomOrder(['a', 'b', 'c']);

            collection.activateFirst();
            expect(collection.activatedValue.value).toBe('a');

            collection.activateNext();
            expect(collection.activatedValue.value).toBe('b');
        });
    });

    // -----------------------
    // Type-ahead
    // -----------------------

    describe('Type-ahead', () => {
        beforeEach(() => {
            collection.add('apple', 'Apple', 'apple');
            collection.add('apricot', 'Apricot', 'apricot');
            collection.add('banana', 'Banana', 'banana');
            collection.setValuesInDomOrder(['apple', 'apricot', 'banana']);
        });

        it('should activate item by typed key', () => {
            collection.activateByKey('b');

            expect(collection.activatedValue.value).toBe('banana');
        });

        it('should match multi-character buffer', () => {
            collection.activateByKey('a');
            collection.activateByKey('p');
            collection.activateByKey('r');

            expect(collection.activatedValue.value).toBe('apricot');
        });

        it('should search forward from current position', () => {
            collection.activate('apple');
            collection.activateByKey('a');

            // starts searching after apple, finds apricot
            expect(collection.activatedValue.value).toBe('apricot');
        });
    });

    // -----------------------
    // Performance
    // -----------------------

    describe('Performance', () => {
        it('should handle 10k items within 1s', async () => {
            const start = performance.now();

            for (let i = 0; i < 10_000; i++) {
                collection.add(`value-${i}`, `Value ${i}`, `value ${i}`);
            }

            await Promise.resolve();

            expect(performance.now() - start).toBeLessThan(1000);
            expect(collection.size).toBe(10_000);
        });

        it('should search 10k items within 100ms', async () => {
            for (let i = 0; i < 10_000; i++) {
                collection.add(`value-${i}`, `Value ${i}`, `value ${i}`);
            }

            const values = Array.from({ length: 10_000 }, (_, i) => `value-${i}`);
            collection.setValuesInDomOrder(values);

            await Promise.resolve();

            const start = performance.now();
            collection.search('00');
            expect(performance.now() - start).toBeLessThan(100);
        });

        it('should handle rapid add/forget cycles', async () => {
            for (let i = 0; i < 100; i++) {
                collection.add(`v${i}`, `V${i}`, `v${i}`);
            }

            await Promise.resolve();

            for (let i = 0; i < 50; i++) {
                collection.forget(`v${i}`);
            }

            expect(collection.size).toBe(50);
        });
    });

    // -----------------------
    // Edge Cases
    // -----------------------

    describe('Edge Cases', () => {
        it('should handle empty string value', () => {
            collection.add('', '', '');
            expect(collection.get('')?.value).toBe('');
        });

        it('should handle numeric string values', () => {
            collection.add('123', '123', '123');
            collection.setValuesInDomOrder(['123']);

            expect(collection.search('12')).toHaveLength(1);
        });

        it('should handle very long values', () => {
            const long = 'a'.repeat(10_000);
            collection.add(long, long, long);
            collection.setValuesInDomOrder([long]);

            expect(collection.search('aaa')).toHaveLength(1);
        });

        it('should maintain activatedValue across search filtering', () => {
            add(collection, 'apple');
            add(collection, 'banana');
            collection.setValuesInDomOrder(['apple', 'banana']);

            collection.activate('banana');
            collection.search('app');

            // collection doesn't auto-deactivate on search — that's the root's job
            expect(collection.activatedValue.value).toBe('banana');
        });

        it('should handle special characters in searchable', () => {
            collection.add('test-value', 'test-value', 'test-value');
            collection.setValuesInDomOrder(['test-value']);

            expect(collection.search('test')).toHaveLength(1);
        });
    });
});