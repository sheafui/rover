import { InputManager, RoverRootContext } from "../types"
import { bindListener } from "./utils"

export function createInputManager(
    rootDataStack: RoverRootContext
): InputManager {
    const inputEl = rootDataStack.$root.querySelector('[x-rover\\:input]') as HTMLInputElement | undefined;

    const inputElExists = (): boolean => {
        if (!inputEl) {
            console.warn(`Input element with [x-rover\\:input] not found`);
            return false
        }
        return true
    }

    return {
        controller: new AbortController,

        on<K extends keyof HTMLElementEventMap>(
            eventKey: K,
            handler: (event: HTMLElementEventMap[K], activeKey: string | undefined) => void
        ) {
            if (!inputElExists()) return;


            const listener = (event: HTMLElementEventMap[K]) => {
                handler(event, rootDataStack.__activatedValue ?? undefined);
            };

            bindListener(inputEl!, eventKey, listener, this.controller);
        },

        get value(): string {
            return inputEl ? inputEl.value : '';
        },

        set value(val: string) {
            if (inputEl) inputEl.value = val;
        },

        focus(preventScroll: boolean = true): void {
            requestAnimationFrame(() => inputEl?.focus({ preventScroll }))
        },

        enableDefaultInputHandlers(disabledEvents: Array<'focus' | 'blur' | 'input' | 'keydown'> = []) {
            if (!inputElExists()) return;

            if (!disabledEvents.includes('focus')) {
                this.on('focus', () => rootDataStack.__startTyping());
            }

            if (!disabledEvents.includes('blur')) {
                this.on('blur', () => rootDataStack.__stopTyping());
            }

            if (!disabledEvents.includes('keydown')) {
                this.on('keydown', (e: KeyboardEvent) => {
                    switch (e.key) {
                        case 'ArrowDown':
                            e.preventDefault(); e.stopPropagation();
                            rootDataStack.__activateNext();
                            break;

                        case 'ArrowUp':
                            e.preventDefault(); e.stopPropagation();
                            rootDataStack.__activatePrev();
                            break;

                        case 'Escape':
                            e.preventDefault(); e.stopPropagation();
                            requestAnimationFrame(() => this.focus(true));
                            break;
                        case 'Home':
                            e.preventDefault();
                            rootDataStack.__activateFirst();
                            break;

                        case 'End':
                            e.preventDefault();
                            rootDataStack.__activateLast();
                            break;
                        case 'Tab':
                            rootDataStack.__stopTyping();
                            break;

                    }
                });
            }
        },

        destroy() {
            this.controller.abort();
        }
    };
}

