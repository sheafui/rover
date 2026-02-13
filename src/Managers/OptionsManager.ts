import { OPTION_SLOT_NAME } from "src/constants";
import { OptionsManager, RoverRootContext } from "src/types";

export function createOptionsManager(root: RoverRootContext): OptionsManager {
    const cleanup: (() => void)[] = [];

    return {
        on<K extends keyof HTMLElementEventMap>(
            eventKey: K,
            handler: (
                event: HTMLElementEventMap[K],
                optionEl: HTMLElement | null,
                activeKey: string | null
            ) => void
        ) {
            root.$nextTick(() => {
                const container = root.$refs.__options as HTMLElement | undefined;
                if (!container) return;

                const listener = (event: HTMLElementEventMap[K]) => {
                    const target = event.target as Element | null;

                    const optionEl = this.findClosestOption(target)

                    const activeKey = root.__activatedKey ?? null;

                    handler(event, optionEl, activeKey);
                };

                container.addEventListener(eventKey, listener);

                cleanup.push(() => {
                    container.removeEventListener(eventKey, listener);
                });
            });
        },

        findClosestOption(el: Element) {
            return Alpine.findClosest(el, node => node.dataset.slot === OPTION_SLOT_NAME && node.hasAttribute('x-rover:option'))
        },

        registerSharedEventListerns() {
            // this.on('mouseover', (event, optionEl) => {
            //     if (!optionEl?.dataset.key) return;
            //     root.collection.activate(optionEl.dataset.key);
            // });

            // this.on('mouseout', () => {
            //     if (!root.__keepActivated) {
            //         root.collection.deactivate();
            //     }
            // });
        },

        destroy() {
            cleanup.forEach(fn => fn());
        }
    };
}
