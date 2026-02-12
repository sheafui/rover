import { Alpine } from "alpinejs";
import { rover as roverMagic } from "./rover";
import { roverOption as roverOptionMagic } from "./roverOption";
import { roverOptions as roverOptionsMagic } from "./roverOptions";
import type { default as AlpineType } from "alpinejs";
import { RoverRootContext } from "src/types";


export default function registerMagics(Alpine: Alpine) {

    Alpine.magic('rover', (el) => {

        let optionEl = Alpine.findClosest(el, i => {
            return i.hasAttribute('x-rover')
        })

        if (!optionEl) throw 'No x-rover directive found, this magic meant to be used under x-rover root context...'

        let dataStack = Alpine.$data(optionEl as AlpineType.ElementWithXAttributes) as RoverRootContext;

        return roverMagic(dataStack);
    });

    Alpine.magic('roverOption', (el) => {

        let optionEl = Alpine.findClosest(el, i => {
            return i.hasAttribute('x-rover:option')
        })

        if (!optionEl) throw 'No x-rover:option directive found, this magic meant to be used per option context...'

        let dataStack = Alpine.$data(optionEl as AlpineType.ElementWithXAttributes) as RoverRootContext;

        return roverOptionMagic(dataStack);
    });

    Alpine.magic('roverOptions', (el) => {

        let optionEls = Alpine.findClosest(el, i => {
            return i.hasAttribute('x-option:options')
        })

        if (!optionEls) throw 'No x-rover:options directive found, this magic meant to be used per options context...'
        let dataStack = Alpine.$data(optionEls as AlpineType.ElementWithXAttributes) as RoverRootContext;

        return roverOptionsMagic(dataStack);
    });
}

