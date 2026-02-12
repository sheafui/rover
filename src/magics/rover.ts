import { ElementWithXAttributes } from "alpinejs";
import { Item, RoverRootContext } from "src/types";

export const rover = (el: ElementWithXAttributes) => {
    let data = Alpine.$data(el) as RoverRootContext;
    return {
        get isOpen() {
            return data.__isOpen;
        },
        get collection() {
            return data.collection;
        },
        onOpen(callback: () => void) {
            data.__onOpen(callback);
        },
        navigator: () => {
            return data.navigator;
        },
        get input() {
            return queueMicrotask(() => { this.$refs.input })
        },
        onClose(callback: () => void) {
            data.__onClose(callback);
        },
        activate(key: string) {
            data.collection.activate(key)
        },
        deactivate() {
            data.collection.deactivate()
        },
        getValueByKey(key: string) {
            return data.collection.getValueByKey(key)
        },
        getActiveItem() {
            return data.collection.getActiveItem()
        },
        activateNext() {
            data.collection.activateNext()
        },
        activatePrev() {
            data.collection.activatePrev()
        },
        activateFirst() {
            data.collection.activateFirst()
        },
        activateLast() {
            data.collection.activateLast()
        },
        searchUsing(query: string): Item[] {
            return data.collection.search(query)
        },
        getKeyByIndex(index: number | null | undefined): string | null {
            return data.collection.getKeyByIndex(index)
        }
    }
}