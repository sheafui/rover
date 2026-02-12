import { RoverRootContext } from "src/types";

export const roverOptions = (dataStack: RoverRootContext) => ({
    isOpen() {
        return dataStack.__isOpen;
    },
    onOpen(callback: () => void) {
        
        console.log(dataStack);
        
        dataStack.__onOpen(callback);
    },
    onClose(callback: () => void) {
        dataStack.__onClose(callback);
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
