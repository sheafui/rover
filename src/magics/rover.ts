import { ElementWithXAttributes } from "alpinejs";
import { ButtonManager, InputManager, Item, OptionManager, OptionsManager, RoverRootContext } from "src/types";

export const rover = (el: ElementWithXAttributes) => {
    let data = Alpine.$data(el) as RoverRootContext;
    return {
        get collection() {
            return data.__collection;
        },

        get input(): InputManager | undefined {
            return data.__inputManager;
        },

        get option(): OptionManager | undefined {
            return data.__optionManager;
        },

        get options(): OptionsManager | undefined {
            return data.__optionsManager;
        },

        get button(): ButtonManager | undefined {
            return data.__buttonManager;
        },

        get isLoading(): boolean {
            return data.__isLoading;
        },
        get inputEl(): HTMLElement | null {
            return data.$root.querySelector('[x-rover\\:input]');
        },
        getActiveItemEl(): HTMLElement | undefined {
            return data.__getActiveItemEl();
        },
        getItemByValue(value: string): Item | undefined {
            return data.__getItemByValue(value);
        },
        getLabel(value: string): string | undefined {
            return data.__getLabelByValue(value);
        },
        isDisabled(value: string): boolean | undefined {
            return data.__getDisabledByValue(value);
        },
        getSearchable(value: string): string | undefined {
            return data.__getSearchableByValue(value);
        },
        getActiveItemId(): string | undefined {
            return this.getActiveItemEl()?.id;
        },
        // re wire up the internal index to catch changes on the dom
        reIndex() {
            // @todo
        },
        getOptionElByValue(value: string): HTMLElement | undefined {
            return data.__optionIndex?.get(value);
        },
        activate(key: string) {
            data.__collection.activate(key)
        },
        deactivate() {
            data.__collection.deactivate()
        },
        getActiveItem() {
            return data.__collection.getActiveItem()
        },
        activateNext() {
            data.__collection.activateNext()
        },
        activatePrev() {
            data.__collection.activatePrev()
        },
        activateFirst() {
            data.__collection.activateFirst()
        },
        activateLast() {
            data.__collection.activateLast()
        },
        activateByKey(key: string) {
            data.__collection.activateByKey(key);
        },
        searchUsing(query: string): Item[] {
            return data.__collection.search(query)
        },
        reconcileDom() {
            this.options.flush();
            this.activateFirst();
        }
    }
}