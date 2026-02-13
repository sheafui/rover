import { RoverRootContext } from "src/types";

export const roverOptions = (dataStack: RoverRootContext) => ({
    isOpen() {
        return dataStack.__isOpen;
    },
    isStatic() {
        return dataStack.__static;
    }
}) 
