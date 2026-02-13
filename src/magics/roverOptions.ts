import { RoverRootContext } from "src/types";

export const roverOptions = (dataStack: RoverRootContext) => ({
    isOpen() {
        return dataStack.__isOpen;
    },
    open() {
        dataStack.__open()
    },
    close() {
        dataStack.__close()
    },
    isStatic() {
        return dataStack.__static;
    }
}) 
