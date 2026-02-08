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
            collection.add('key1', 'value1');

            expect(collection.size).toBe(1);
            expect(collection.get('key1')).toEqual({
                key: 'key1',
                value: 'value1',
                disabled: false
            });
        });

        it('should add multiple items', () => {
            collection.add('key1', 'value1');
            collection.add('key2', 'value2');
            collection.add('key3', 'value3');

            expect(collection.size).toBe(3);
            expect(collection.all()).toHaveLength(3);
        });

        it('should add disabled items', () => {
            collection.add('key1', 'value1', true);

            const item = collection.get('key1') as Item;
            expect(item.disabled).toBe(true);
        });

        it('should not add duplicate keys', () => {
            collection.add('key1', 'value1');
            collection.add('key1', 'value2'); // Should be ignored

            expect(collection.size).toBe(1);
            expect(collection.get('key1')?.value).toBe('value1');
        });

        it('should invalidate indexes when adding items', async () => {
            collection.add('key1', 'value1');

            // Wait for microtask to complete
            await Promise.resolve();

            expect(collection.pending.state).toBe(false);
        });
    });

    describe('Removing Items', () => {
        beforeEach(() => {
            collection.add('key1', 'Apple');
            collection.add('key2', 'Banana');
            collection.add('key3', 'Cherry');
        });

        it('should remove an item by key', () => {
            collection.forget('key2');

            expect(collection.size).toBe(2);
            expect(collection.get('key2')).toBeUndefined();
        });

        it('should handle removing non-existent key gracefully', () => {
            collection.forget('nonexistent');

            expect(collection.size).toBe(3);
        });

        it('should deactivate item if it was active', () => {
            collection.activate('key2');
            expect(collection.activeIndex.value).toBe(1);

            collection.forget('key2');

            expect(collection.activeIndex.value).toBeUndefined();
        });

        it('should adjust activeIndex if removing item before active one', () => {
            collection.activate('key3');
            expect(collection.activeIndex.value).toBe(2);

            collection.forget('key1');

            expect(collection.activeIndex.value).toBe(1); // in this case key3 shifts to index 1
        });

        it('should not adjust activeIndex if removing item after active one', () => {
            collection.activate('key1');
            expect(collection.activeIndex.value).toBe(0);

            collection.forget('key3');

            expect(collection.activeIndex.value).toBe(0); // key1 is still at index 0
        });
    });

    describe('Activation', () => {
        beforeEach(() => {
            collection.add('key1', 'Apple');
            collection.add('key2', 'Banana');
            collection.add('key3', 'Cherry');
            collection.add('key4', 'Date', true); // Disabled
        });

        it('should activate an item by key', async () => {
            collection.activate('key2');

            expect(collection.activeIndex.value).toBe(1);
            expect(collection.getActiveItem()).toEqual({
                key: 'key2',
                value: 'Banana',
                disabled: false
            });
        });

        it('should not activate disabled items', async () => {
            collection.activate('key4');

            expect(collection.activeIndex.value).toBeUndefined();
        });

        it('should not activate non-existent items', () => {
            collection.activate('nonexistent');

            expect(collection.activeIndex.value).toBeUndefined();
        });

        it('should check if item is activated', () => {
            collection.activate('key2');

            expect(collection.isActivated('key2')).toBe(true);
            expect(collection.isActivated('key1')).toBe(false);
        });

        it('should deactivate current item', () => {
            collection.activate('key2');
            expect(collection.activeIndex.value).toBe(1);

            collection.deactivate();

            expect(collection.activeIndex.value).toBeUndefined();
            expect(collection.getActiveItem()).toBeNull();
        });

        it('should not reactivate if already active', () => {
            collection.activate('key2');
            const firstIndex = collection.activeIndex.value;

            collection.activate('key2');

            expect(collection.activeIndex.value).toBe(firstIndex);
        });
    });

    describe('Keyboard Navigation', () => {
        beforeEach(() => {
            collection.add('key1', 'Apple');
            collection.add('key2', 'Banana', true); // Disabled - should be skipped
            collection.add('key3', 'Cherry');
            collection.add('key4', 'Date');
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

            // Should skip disabled key2 and go to key3
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
            collection.activate('key4');
            await Promise.resolve();

            collection.activatePrev();

            // Should skip disabled key2 and go to key3
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
            emptyNav.add('key1', 'val1', true);
            emptyNav.add('key2', 'val2', true);

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
            collection.add('key1', 'Apple');
            collection.add('key2', 'Banana');
            collection.add('key3', 'Cherry');
            collection.add('key4', 'Apricot');
            collection.add('key5', 'Blueberry');
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
            collection.add('key6', 'Café');
            await Promise.resolve();

            const results = collection.search('cafe');

            expect(results.some(r => r.value === 'Café')).toBe(true);
        });

        it('should normalize unicode characters', async () => {
            collection.add('key7', 'naïve');
            await Promise.resolve();

            const results = collection.search('naive');

            expect(results.some(r => r.value === 'naïve')).toBe(true);
        });

        it('should return empty array when no matches', () => {
            const results = collection.search('xyz');

            expect(results).toHaveLength(0);
        });

        it('should handle special characters in search', async () => {
            collection.add('key8', 'test-value');

            await Promise.resolve();
            const results = collection.search('test');

            console.log('search results for "test"', results);
            expect(results.some(r => r.value === 'test-value')).toBe(true);
        });
    });

    describe('Queries', () => {
        beforeEach(() => {
            collection.add('key1', 'Apple');
            collection.add('key2', 'Banana');
            collection.add('key3', 'Cherry');
        });

        it('should get item by key', () => {
            const item = collection.get('key2');

            expect(item).toEqual({
                key: 'key2',
                value: 'Banana',
                disabled: false
            });
        });

        it('should return undefined for non-existent key', () => {
            const item = collection.get('nonexistent');

            expect(item).toBeUndefined();
        });

        it('should get value by key', () => {
            const value = collection.getValueByKey('key2');

            expect(value).toBe('Banana');
        });

        it('should get key by index', () => {
            const key = collection.getKeyByIndex(1);

            expect(key).toBe('key2');
        });

        it('should return null for invalid index', () => {
            expect(collection.getKeyByIndex(999)).toBeNull();
            expect(collection.getKeyByIndex(null)).toBeNull();
            expect(collection.getKeyByIndex(undefined)).toBeNull();
        });

        it('should get all items', () => {
            const all = collection.all();

            expect(all).toHaveLength(3);
            expect(all[0]?.value).toBe('Apple');
        });

        it('should get collection size', () => {
            expect(collection.size).toBe(3);

            collection.add('key4', 'Date');
            expect(collection.size).toBe(4);

            collection.forget('key1');
            expect(collection.size).toBe(3);
        });
    });

    describe('Pending State', () => {
        it('should set pending state when adding items', () => {
            collection.add('key1', 'value1');

            // Should be pending immediately
            expect(collection.pending.state).toBe(true);
        });

        it('should clear pending state after microtask', async () => {
            collection.add('key1', 'value1');

            await Promise.resolve();

            expect(collection.pending.state).toBe(false);
        });

        it('should batch multiple operations', async () => {
            collection.add('key1', 'value1');
            collection.add('key2', 'value2');
            collection.add('key3', 'value3');

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
            collection.add('key1', '');

            expect(collection.get('key1')?.value).toBe('');
            expect(collection.size).toBe(1);
        });

        it('should handle numeric values as strings', () => {
            collection.add('key1', '123');

            const results = collection.search('12');
            expect(results).toHaveLength(1);
        });

        it('should handle rapid add/forget cycles', async () => {
            for (let i = 0; i < 100; i++) {
                collection.add(`key${i}`, `value${i}`);
            }

            await Promise.resolve();

            for (let i = 0; i < 50; i++) {
                collection.forget(`key${i}`);
            }

            expect(collection.size).toBe(50);
        });

        it('should maintain activation during search filtering', () => {
            collection.add('key1', 'Apple');
            collection.add('key2', 'Banana');
            collection.add('key3', 'Cherry');

            collection.activate('key2');

            // Search that excludes active item
            collection.search('app');

            // Active index should still be set
            expect(collection.activeIndex.value).toBe(1);
            expect(collection.isActivated('key2')).toBe(true);
        });

        it('should handle very long values', () => {
            const longValue = 'a'.repeat(10000);
            collection.add('key1', longValue);

            const results = collection.search('aaa');
            expect(results).toHaveLength(1);
        });

        it('should handle special unicode characters', async () => {
            collection.add('key1', '😀 Emoji');
            collection.add('key2', '你好 Chinese');
            await Promise.resolve();

            expect(collection.search('emoji')).toHaveLength(1);
            expect(collection.search('中文')).toHaveLength(0);
        });
    });

    describe('Memory and Performance', () => {
        it('should handle large collections efficiently', async () => {
            const startTime = performance.now();

            for (let i = 0; i < 1000; i++) {
                collection.add(`key${i}`, `Value ${i}`);
            }

            await Promise.resolve();

            const endTime = performance.now();

            expect(collection.size).toBe(1000);
            expect(endTime - startTime).toBeLessThan(100); // Should complete in < 1s
        });

        it('should search large collections efficiently', async () => {
            for (let i = 0; i < 1000; i++) {
                collection.add(`key${i}`, `Value ${i}`);
            }

            await Promise.resolve();

            const startTime = performance.now();
            collection.search('500');
            const endTime = performance.now();

            expect(endTime - startTime).toBeLessThan(100); // Should complete in < 100ms
        });
    });
});