import { Item, RoverRootContext } from "src/types";

export const rover = (dataStack: RoverRootContext) => ({
    get isOpen() {
        return dataStack.__isOpen;
    },
    get collection(){
        return dataStack.collection;
    },
    onOpen(callback: () => void) {
        dataStack.__onOpen(callback);
    },
    // onClose(callback: () => void) {
    //     dataStack.__onClose(callback);
    // },
    // onChange(callback: () => void) {
    //     dataStack.__onChange(callback);
    // },  
    activate(key: string) {
        dataStack.collection.activate(key)
    },
    deactivate() {
        dataStack.collection.deactivate()
    },
    getValueByKey(key: string) {
        return dataStack.collection.getValueByKey(key)
    },
    getActiveItem() {
        return dataStack.collection.getActiveItem()
    },
    activateNext() {
        dataStack.collection.activateNext()
    },
    activatePrev() {
        dataStack.collection.activatePrev()
    },
    activateFirst() {
        dataStack.collection.activateFirst()
    },
    activateLast() {
        dataStack.collection.activateLast()
    },
    searchUsing(query: string): Item[] {
        return dataStack.collection.search(query)
    },
    getKeyByIndex(index: number | null | undefined): string | null {
        return dataStack.collection.getKeyByIndex(index)
    }
})