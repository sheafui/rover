import RoverCollection from 'src/core/RoverCollection';
import { Item } from 'src/types';
import { describe, it, expect, beforeEach } from 'vitest';

describe('RoverCollection', () => {
    let collection: RoverCollection;

    beforeEach(() => {
        collection = new RoverCollection();
    });

    describe('Initialization', () => {
        it('should initialize with empty items', () => {
            expect(collection.size).toBe(0);
            expect(collection.all()).toEqual([]);
        });

        it('should initialize with default search threshold', () => {
            expect(collection.searchThreshold).toBe(500);
        });

        it('should initialize with custom search threshold', () => {
            const customCollection = new RoverCollection({ searchThreshold: 1000 });
            expect(customCollection.searchThreshold).toBe(1000);
        });

        it('should initialize pending state as false', () => {
            expect(collection.pending.state).toBe(false);
        });

        it('should initialize activeIndex as undefined', () => {
            expect(collection.activeIndex.value).toBeUndefined();
        });
    });

    describe('Adding Items', () => {
        it('should add a single item', () => {
            collection.add('Apple');

            expect(collection.size).toBe(1);
            expect(collection.get('Apple')).toEqual({
                value: 'Apple',
                disabled: false
            });
        });

        it('should add multiple items', () => {
            collection.add('Apple');
            collection.add('Banana');
            collection.add('Cherry');

            expect(collection.size).toBe(3);
            expect(collection.all()).toHaveLength(3);
        });

        it('should add disabled items', () => {
            collection.add('Apple', true);

            const item = collection.get('Apple') as Item;
            expect(item.disabled).toBe(true);
        });

        it('should invalidate indexes when adding items', async () => {
            collection.add('Apple');

            // Wait for microtask to complete
            await Promise.resolve();

            expect(collection.pending.state).toBe(false);
        });
    });

    describe('Removing Items', () => {
        beforeEach(() => {
            collection.add('Apple');
            collection.add('Banana');
            collection.add('Cherry');
        });

        it('should remove an item by value', () => {
            collection.forget('Banana');

            expect(collection.size).toBe(2);
            expect(collection.get('Banana')).toBeUndefined();
        });

        it('should handle removing non-existent value gracefully', () => {
            collection.forget('Nonexistent');

            expect(collection.size).toBe(3);
        });

        it('should deactivate item if it was active', () => {
            collection.activate('Banana');
            expect(collection.activeIndex.value).toBe(1);

            collection.forget('Banana');

            expect(collection.activeIndex.value).toBeUndefined();
        });

        it('should adjust activeIndex if removing item before active one', () => {
            collection.activate('Cherry');
            expect(collection.activeIndex.value).toBe(2);

            collection.forget('Apple');

            expect(collection.activeIndex.value).toBe(1);
        });

        it('should not adjust activeIndex if removing item after active one', () => {
            collection.activate('Apple');
            expect(collection.activeIndex.value).toBe(0);

            collection.forget('Cherry');

            expect(collection.activeIndex.value).toBe(0);
        });
    });

    describe('Activation', () => {
        beforeEach(() => {
            collection.add('Apple');
            collection.add('Banana');
            collection.add('Cherry');
            collection.add('Date', true); // Disabled
        });

        it('should activate an item by value', async () => {
            collection.activate('Banana');

            expect(collection.activeIndex.value).toBe(1);
            expect(collection.getActiveItem()).toEqual({
                value: 'Banana',
                disabled: false
            });
        });

        it('should not activate disabled items', async () => {
            collection.activate('Date');

            expect(collection.activeIndex.value).toBeUndefined();
        });

        it('should not activate non-existent items', () => {
            collection.activate('Nonexistent');

            expect(collection.activeIndex.value).toBeUndefined();
        });

        it('should check if item is activated', () => {
            collection.activate('Banana');

            expect(collection.isActivated('Banana')).toBe(true);
            expect(collection.isActivated('Apple')).toBe(false);
        });

        it('should deactivate current item', () => {
            collection.activate('Banana');
            expect(collection.activeIndex.value).toBe(1);

            collection.deactivate();

            expect(collection.activeIndex.value).toBeUndefined();
            expect(collection.getActiveItem()).toBeNull();
        });

        it('should not reactivate if already active', () => {
            collection.activate('Banana');
            const firstIndex = collection.activeIndex.value;

            collection.activate('Banana');

            expect(collection.activeIndex.value).toBe(firstIndex);
        });
    });

    describe('Keyboard Navigation', () => {
        beforeEach(() => {
            collection.add('Apple');
            collection.add('Banana', true); // Disabled - should be skipped
            collection.add('Cherry');
            collection.add('Date');
        });

        it('should activate first non-disabled item', async () => {
            collection.activateFirst();

            expect(collection.activeIndex.value).toBe(0);
            expect(collection.getActiveItem()?.value).toBe('Apple');
        });

        it('should activate last non-disabled item', async () => {
            collection.activateLast();

            await Promise.resolve();

            expect(collection.activeIndex.value).toBe(3);
            expect(collection.getActiveItem()?.value).toBe('Date');
        });

        it('should activate next item', async () => {
            collection.activateFirst();
            await Promise.resolve();

            collection.activateNext();

            // Should skip disabled Banana and go to Cherry
            expect(collection.activeIndex.value).toBe(2);
            expect(collection.getActiveItem()?.value).toBe('Cherry');
        });

        it('should wrap around when activating next from last item', async () => {
            collection.activateLast();
            await Promise.resolve();

            collection.activateNext();

            // Should wrap to first
            expect(collection.activeIndex.value).toBe(0);
            expect(collection.getActiveItem()?.value).toBe('Apple');
        });

        it('should activate previous item', async () => {
            collection.activate('Date');
            await Promise.resolve();

            collection.activatePrev();

            // Should skip disabled Banana and go to Cherry
            expect(collection.activeIndex.value).toBe(2);
            expect(collection.getActiveItem()?.value).toBe('Cherry');
        });

        it('should wrap around when activating prev from first item', async () => {
            collection.activateFirst();
            await Promise.resolve();

            collection.activatePrev();

            // Should wrap to last
            expect(collection.activeIndex.value).toBe(3);
            expect(collection.getActiveItem()?.value).toBe('Date');
        });

        it('should activate first when calling next with no active item', () => {
            collection.activateNext();

            expect(collection.activeIndex.value).toBe(0);
        });

        it('should activate last when calling prev with no active item', () => {
            collection.activatePrev();

            expect(collection.activeIndex.value).toBe(3);
        });

        it('should handle navigation with all items disabled', () => {
            const emptyNav = new RoverCollection();
            emptyNav.add('Item1', true);
            emptyNav.add('Item2', true);

            emptyNav.activateFirst();

            expect(emptyNav.activeIndex.value).toBeUndefined();
        });

        it('should handle navigation with empty collection', () => {
            const empty = new RoverCollection();

            empty.activateFirst();
            empty.activateNext();
            empty.activatePrev();

            expect(empty.activeIndex.value).toBeUndefined();
        });
    });

    describe('Search', () => {
        beforeEach(() => {
            collection.add('Apple');
            collection.add('Banana');
            collection.add('Cherry');
            collection.add('Apricot');
            collection.add('Blueberry');
        });

        it('should return all items when query is empty', () => {
            const results = collection.search('');

            expect(results).toHaveLength(5);
        });

        it('should filter items by query', () => {
            const results: Item[] = collection.search('app');

            expect(results).toHaveLength(1);
            expect(results[0]?.value).toBe('Apple');
        });

        it('should be case insensitive', () => {
            const results = collection.search('BANANA');

            expect(results).toHaveLength(1);
            expect(results[0]?.value).toBe('Banana');
        });

        it('should handle partial matches', () => {
            const results = collection.search('berry');

            expect(results).toHaveLength(1);
            expect(results[0]?.value).toBe('Blueberry');
        });

        it('should optimize incremental search', () => {
            // First search
            const results1 = collection.search('a');
            expect(results1).toHaveLength(3); // Apple, Banana, Apricot

            // Incremental search should filter from previous results
            const results2 = collection.search('ap');
            expect(results2).toHaveLength(2); // Apple, Apricot

            const results3 = collection.search('app');
            expect(results3).toHaveLength(1); // Apple
        });

        it('should reset search cache when query is not incremental', () => {
            collection.search('app');

            const results = collection.search('ban');

            expect(results).toHaveLength(1);
            expect(results[0]?.value).toBe('Banana');
        });

        it('should handle accented characters', async () => {
            collection.add('Café');
            await Promise.resolve();

            const results = collection.search('cafe');

            expect(results.some(r => r.value === 'Café')).toBe(true);
        });

        it('should normalize unicode characters', async () => {
            collection.add('naïve');
            await Promise.resolve();

            const results = collection.search('naive');

            expect(results.some(r => r.value === 'naïve')).toBe(true);
        });

        it('should return empty array when no matches', () => {
            const results = collection.search('xyz');

            expect(results).toHaveLength(0);
        });

        it('should handle special characters in search', async () => {
            collection.add('test-value');

            await Promise.resolve();
            const results = collection.search('test');

            expect(results.some(r => r.value === 'test-value')).toBe(true);
        });
    });

    describe('Queries', () => {
        beforeEach(() => {
            collection.add('Apple');
            collection.add('Banana');
            collection.add('Cherry');
        });

        it('should get item by value', () => {
            const item = collection.get('Banana');

            expect(item).toEqual({
                value: 'Banana',
                disabled: false
            });
        });

        it('should return undefined for non-existent value', () => {
            const item = collection.get('Nonexistent');

            expect(item).toBeUndefined();
        });

        it('should get item by index', () => {
            const item = collection.getByIndex(1);

            expect(item?.value).toBe('Banana');
        });

        it('should return null for invalid index', () => {
            expect(collection.getByIndex(999)).toBeNull();
            expect(collection.getByIndex(null)).toBeNull();
            expect(collection.getByIndex(undefined)).toBeNull();
        });

        it('should get all items', () => {
            const all = collection.all();

            expect(all).toHaveLength(3);
            expect(all[0]?.value).toBe('Apple');
        });

        it('should get collection size', () => {
            expect(collection.size).toBe(3);

            collection.add('Date');
            expect(collection.size).toBe(4);

            collection.forget('Apple');
            expect(collection.size).toBe(3);
        });
    });

    describe('Pending State', () => {
        it('should set pending state when adding items', () => {
            collection.add('Apple');

            // Should be pending immediately
            expect(collection.pending.state).toBe(true);
        });

        it('should clear pending state after microtask', async () => {
            collection.add('Apple');

            await Promise.resolve();

            expect(collection.pending.state).toBe(false);
        });

        it('should batch multiple operations', async () => {
            collection.add('Item1');
            collection.add('Item2');
            collection.add('Item3');

            // Should still be pending
            expect(collection.pending.state).toBe(true);

            await Promise.resolve();

            // Should be done after one microtask
            expect(collection.pending.state).toBe(false);
        });

        it('should toggle pending state manually', () => {
            expect(collection.pending.state).toBe(false);

            collection.toggleIsPending();
            expect(collection.pending.state).toBe(true);

            collection.toggleIsPending();
            expect(collection.pending.state).toBe(false);
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty string values', () => {
            collection.add('');

            expect(collection.get('')?.value).toBe('');
            expect(collection.size).toBe(1);
        });

        it('should handle numeric values as strings', () => {
            collection.add('123');

            const results = collection.search('12');
            expect(results).toHaveLength(1);
        });

        it('should handle rapid add/forget cycles', async () => {
            for (let i = 0; i < 100; i++) {
                collection.add(`value${i}`);
            }

            await Promise.resolve();

            for (let i = 0; i < 50; i++) {
                collection.forget(`value${i}`);
            }

            expect(collection.size).toBe(50);
        });

        it('should maintain activation during search filtering', () => {
            collection.add('Apple');
            collection.add('Banana');
            collection.add('Cherry');

            collection.activate('Banana');

            // Search that excludes active item
            collection.search('app');

            // Active index should still be set
            expect(collection.activeIndex.value).toBe(1);
            expect(collection.isActivated('Banana')).toBe(true);
        });

        it('should handle very long values', () => {
            const longValue = 'a'.repeat(10000);
            collection.add(longValue);

            const results = collection.search('aaa');
            expect(results).toHaveLength(1);
        });

        it('should handle special unicode characters', async () => {
            collection.add('😀 Emoji');
            collection.add('你好 Chinese');
            await Promise.resolve();

            expect(collection.search('emoji')).toHaveLength(1);
        });
    });

    describe('Memory and Performance without virtualizer', () => {
        it('should handle large collections efficiently', async () => {
            const startTime = performance.now();

            for (let i = 0; i < 10000; i++) {
                collection.add(`Value ${i}`);
            }

            await Promise.resolve();

            const endTime = performance.now();

            expect(collection.size).toBe(10000);
            expect(endTime - startTime).toBeLessThan(1000); // Should complete in < 1s
        });

        it('should search large collections efficiently', async () => {
            for (let i = 0; i < 10000; i++) {
                collection.add(`Value ${i}`);
            }

            await Promise.resolve();

            const startTime = performance.now();
            collection.search('00');
            const endTime = performance.now();

            expect(endTime - startTime).toBeLessThan(100); // Should complete in < 100ms
        });
    });
});