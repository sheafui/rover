import { Item, RoverRootContext } from "src/types";

export const roverOption = (dataStack: RoverRootContext) => ({
    activate(key: string) {
        dataStack.__collection.activate(key)
    },
    deactivate() {
        dataStack.__collection.deactivate()
    },
    getValueByKey(key: string) {
        return dataStack.__collection.getValueByKey(key)
    },
    getActiveItem() {
        return dataStack.__collection.getActiveItem()
    },
    activateNext() {
        dataStack.__collection.activateNext()
    },
    activatePrev() {
        dataStack.__collection.activatePrev()
    },
    activateFirst() {
        dataStack.__collection.activateFirst()
    },
    activateLast() {
        dataStack.__collection.activateLast()
    },
    searchUsing(query: string): Item[] {
        return dataStack.__collection.search(query)
    },
    getKeyByIndex(index: number | null | undefined): string | null {
        return dataStack.__collection.getKeyByIndex(index)
    }
})