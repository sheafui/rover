export interface Options {
    searchThreshold?: number
}

export interface Item {
    key: string,
    value: string,
    disabled: boolean
}

export type Pending = { state: boolean };
export type ActiveIndex = { value: undefined | number };

export type SearchIndex = Omit<Item, 'disabled'>;
