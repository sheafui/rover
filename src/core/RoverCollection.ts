import type { Item, Pending, ActiveIndex, Options } from "src/types";

export default class RoverCollection {

    private items: Array<Item> = [];
    private itemsSet: Set<string>;


    private throwOnDuplication: boolean = false;

    public activatedValue: ActiveIndex;

    // Batch processing
    public pending: Pending;

    public constructor(options: Options) {
        this.pending = Alpine.reactive<Pending>({ value: false });
        this.activatedValue = Alpine.reactive<ActiveIndex>({ value: undefined });
        this.throwOnDuplication = options.throwOnDuplication;
    }

    public add(value: string, searchable: string, disabled = false): void {


        const item = { value, disabled, searchable };

        // keep only the last accurance of the given value and may thrown that to the end user 
        if (this.itemsSet.has(value)) {

            if (this.throwOnDuplication) console.warn('duplicate value detected for', value);

            this.itemsSet.delete(value)
        }

        this.items.push(item);

        this.itemsSet.add(value);
    }

    public forget(value: string): void {


        const index = this.items.findIndex(item => item.value === value);

        if (index === -1) return;

        this.items.splice(index, 1);
    }
}