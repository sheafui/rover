import { InputManager, RoverRootContext } from "../types"
import { bindListener } from "./utils"

export function createInputManager(
    rootContext: RoverRootContext
): InputManager {
    const cleanup: (() => void)[] = [];
    const inputEl = rootContext.$el.querySelector('[x-rover\\:input]') as HTMLInputElement | undefined;

    if (!inputEl) {
        console.warn(`Input element with [x-rover\\:input] not found`);
    }

    return {
        on<K extends keyof HTMLElementEventMap>(
            eventKey: K,
            handler: (event: HTMLElementEventMap[K], activeKey: string | undefined) => void
        ) {
            if (!inputEl) return;

            const listener = (event: HTMLElementEventMap[K]) => {
                const activeKey = rootContext.__activatedKey ?? undefined;
                handler(event, activeKey);
            };

            bindListener(inputEl, eventKey, listener, cleanup);
        },

        get value(): string {
            return inputEl ? inputEl.value : "";
        },

        set value(val: string) {
            if (inputEl) inputEl.value = val;
        },

        /**
         * Attach the default shared input events (focus, blur, input, keydown)
         * @param disabledEvents Array of event names to exclude
         */
        enableDefaultInputHandlers(disabledEvents: Array<'focus' | 'blur' | 'input' | 'keydown'> = []) {
            if (!inputEl) return;

            if (!disabledEvents.includes('focus')) {
                this.on('focus', () => rootContext.__startTyping());
            }

            if (!disabledEvents.includes('input')) {
                this.on('input', () => {
                    if (rootContext.__isTyping) rootContext.__open();
                });
            }

            if (!disabledEvents.includes('blur')) {
                this.on('blur', () => rootContext.__stopTyping());
            }

            if (!disabledEvents.includes('keydown')) {
                this.on('keydown', (e: KeyboardEvent) => {
                    switch (e.key) {
                        case 'ArrowDown':
                            e.preventDefault(); e.stopPropagation();
                            if (!rootContext.__isOpen) { rootContext.__open(); break; }
                            rootContext.__activateNext();
                            break;

                        case 'ArrowUp':
                            e.preventDefault(); e.stopPropagation();
                            if (!rootContext.__isOpen) { rootContext.__open(); break; }
                            rootContext.__activatePrev();
                            break;

                        case 'Escape':
                            e.preventDefault(); e.stopPropagation();
                            rootContext.__close();
                            requestAnimationFrame(() => inputEl?.focus({ preventScroll: true }));
                            break;
                    }
                });
            }
        },

        destroy() {
            cleanup.forEach(fn => fn());
        }
    };
}

