import { Magics, XDataContext } from "alpinejs";
import RoverCollection from "./core/RoverCollection";

export interface Options {
    searchThreshold?: number;
    preventDuplication: boolean
}

export interface Item {
    value: string,
    label: string,
    searchable: string,
    disabled: boolean
}

export type Pending = { value: boolean };

export type ActiveIndex = { value: undefined | number };

export type SearchIndex = Omit<Item, 'disabled'>;

export interface RoverRootData extends XDataContext, Record<string, unknown> {
    __collection: RoverCollection;
    __optionsEls: HTMLElement[] | undefined;
    __groupsEls: HTMLElement[] | undefined;
    __isOpen: boolean;
    __isTyping: boolean;
    __isLoading: boolean;
    __g_id: number;
    __s_id: number;
    __static: boolean;
    __keepActivated: boolean;
    __items: UIItem[];
    __optionsEl: HTMLElement | undefined;
    __activatedValue: string | null | undefined;
    __filteredValues: string[] | null;

    __optionIndex: Map<string, HTMLElement> | undefined;
    __prevActivatedValue: string | undefined;

    __effectRAF: null | number;
    // Managers
    __inputManager: InputManager | undefined;
    __optionManager: OptionManager | undefined;
    __optionsManager: OptionsManager | undefined;
    __buttonManager: ButtonManager | undefined;

    // Methods
    __add: (value: string, label: string, searchable: string | undefined, disabled: boolean) => void;
    __forget: (value: string) => void;
    __activate: (value: string) => void;
    __isActive: (value: string) => boolean;
    __deactivate: () => void;
    __getActiveItem: () => Item | null;
    __activateNext: () => void;
    __activatePrev: () => void;
    __activateFirst: () => void;
    __activateLast: () => void;
    __searchUsingQuery: (query: string) => Item[];
    __startTyping: () => void;
    __stopTyping: () => void;
    __pushGroupToItems: (id: string) => void;
    __pushSeparatorToItems: (id: string) => void;
    __nextGroupId: () => number;
    __nextSeparatorId: () => number;
    __flush: () => void;
    __buildOptions: () => void;
    __getActiveItemEl: () => HTMLElement | undefined;
    // __handleGroupsVisibility: () => void,
    // __handleSeparatorsVisibility: () => void,
    patchItemsVisibility: (value: string[] | null) => void,
    patchItemsActivity: (value: string | undefined) => void,
    __getItemByValue: (value: string) => Item | undefined,
    __getLabelByValue: (value: string) => string | undefined,
    __getSearchableByValue: (value: string) => string | undefined,
    __getDisabledByValue: (value: string) => boolean | undefined,
    _x_activateCreateOptionEl?: () => void 

}

export type RoverRootContext = RoverRootData & Magics<RoverRootData>;

export interface RoverInputData extends XDataContext {
    __displayValue?: (value: any) => string;
    __handleEvents: () => void;
}

export type RoverInputContext = RoverRootData & RoverInputData & Magics<RoverInputData>;

export interface RoverOptionData extends XDataContext {
    __value: undefined | string
}

export type RoverOptionContext = RoverRootData & RoverOptionData & Magics<RoverOptionData>;

export interface RoverCreateOptionData extends XDataContext {
    _x_activateCreateOptionEl: () => void
}

export type RoverCreateOptionContext = RoverRootData & RoverCreateOptionData & Magics<RoverCreateOptionData>;

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

export interface Destroyable {
    destroy(): void
}
export interface Abortable {
    controller: AbortController
}

export interface InputManager extends Destroyable, Abortable {
    on<K extends keyof HTMLElementEventMap>(
        eventKey: K,
        handler: (
            event: HTMLElementEventMap[K],
            activeKey: string | undefined
        ) => void
    ): void;

    get value(): string
    set value(val: string)
    focus: (preventScroll: boolean) => void;
    get el(): HTMLInputElement | undefined;

    enableDefaultInputHandlers(disabledEvents: Array<'focus' | 'blur' | 'input' | 'keydown'>): void;
}

export interface OptionsManager extends Destroyable, Abortable {
    on<K extends keyof HTMLElementEventMap>(
        eventKey: K,
        handler: (
            event: HTMLElementEventMap[K],
            optionEl: HTMLElement | undefined,
            activeKey: string | null
        ) => void
    ): void
    get all(): Array<HTMLElement>;
    flush(): void;
    findClosestOption(el: HTMLElement | null): HTMLElement | undefined

    enableDefaultOptionsHandlers(disabledEvents: Array<'focus' | 'blur' | 'input' | 'keydown'>): void
}


export interface OptionManager extends Destroyable, Pick<InputManager, 'on'>, Abortable {
}
export interface ButtonManager extends Destroyable, Pick<InputManager, 'on'>, Abortable {
}


