import { Magics, XDataContext } from "alpinejs";

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

export interface RoverRootData extends XDataContext {
    __state: string | string[] | null;
    __isOpen: boolean;
    __isMultiple: boolean;
    __isTyping: boolean;
    __isLoading: boolean;
    __isDisabled: boolean;
    __o_id: number;
    __g_id: number;
    __s_id: number;
    __static: boolean;
    __keepActivated: boolean;
    __items: UIItem[];
    __optionsEl: HTMLElement | undefined;
    __compareBy: string | ((a: unknown, b: unknown) => boolean) | undefined;
    __activatedKey: string | null | undefined;
    __selectedKeys: string | string[] | null | undefined;
    __filteredKeys: string[] | null;
    __filteredKeysSet: Set<string>;
    __searchQuery: string;

    // Methods
    __add: (k: string, v: string, d: boolean) => void;
    __forget: (k: string) => void;
    __activate: (k: string) => void;
    __isActive: (k: string) => boolean;
    __deactivate: () => void;
    __getValueByKey: (k: string) => string | undefined;
    __getActiveItem: () => Item | null;
    __activateNext: () => void;
    __activatePrev: () => void;
    __activateFirst: () => void;
    __activateLast: () => void;
    __searchUsingQuery: (query: string) => Item[];
    __getKeyByIndex: (index: number | null | undefined) => string | null;
    // __isVisible: (key: string) => boolean;
    __open: () => void;
    __activateSelectedOrFirst: (activateSelected?: boolean) => void;
    __registerEventsDelector: () => void;
    __close: () => void;
    __handleSelection: (key: string) => void;
    __selectActive: () => void;
    __startTyping: () => void;
    __stopTyping: () => void;
    __resetInput: () => void;
    __getCurrentValue: () => string;
    __compare: (a: unknown, b: unknown) => boolean;
    __pushGroupToItems: (key: string) => void;
    __pushOptionToItems: (key: string) => void;
    __pushSeparatorToItems: (key: string) => void;
    __nextOptionId: () => number;
    __nextGroupId: () => number;
    __nextSeparatorId: () => number;
}

export type RoverRootContext = RoverRootData & Magics<RoverRootData>;

export interface RoverInputData extends XDataContext {
    __displayValue?: (value: any) => string;
    __handleEvents: () => void;
}

export type RoverInputContext = RoverRootData & RoverInputData & Magics<RoverInputData>;

export interface RoverOptionData extends XDataContext {
    __uniqueKey: string;
    __isVisible: boolean;
}

export type RoverOptionContext = RoverRootData & RoverOptionData & Magics<RoverOptionData>;

export interface RoverOptionsData extends Partial<RoverRootData> {
    __handleClickAway: (this: RoverOptionsContext, event: MouseEvent) => void;
}

export type RoverOptionsContext = RoverRootData & RoverOptionsData & Magics<RoverOptionsData>;

export type UIItem = {
    type:
    'o' | // option
    'g' | // group
    's'; // separator

    key?: string;
}