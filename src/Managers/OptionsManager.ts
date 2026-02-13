import { OPTION_SLOT_NAME } from "src/constants";
import { OptionsManager, RoverRootContext } from "src/types";
import { bindListener } from "./utils";

export function createOptionsManager(root: RoverRootContext): OptionsManager {
    const cleanup: (() => void)[] = [];

    const optionsEl = root.$el.querySelector('[x-rover\\:options]') as HTMLElement | undefined;
    if (!optionsEl) console.warn("Options container not found");

    const findClosestOption = (el?: Element): HTMLElement | undefined => {
        if (!el) return undefined;
        return Alpine.findClosest(el, node => node.dataset.slot === OPTION_SLOT_NAME && node.hasAttribute("x-rover:option")) as HTMLElement | undefined;
    };

    return {
        on<K extends keyof HTMLElementEventMap>(
            eventKey: K,
            handler: (event: HTMLElementEventMap[K], optionEl: HTMLElement | undefined, activeKey: string | null) => void
        ) {
            if (!optionsEl) return;

            const listener = (event: HTMLElementEventMap[K]) => {
                const optionEl = findClosestOption(event.target as Element | undefined);
                const activeKey = root.__activatedKey ?? null;
                handler(event, optionEl, activeKey);
            };

            bindListener(optionsEl, eventKey, listener, cleanup);
        },

        findClosestOption,

        enableDefaultOptionsHandlers(disabledEvents: string[] = []) {
            const events = {
                click: (optionEl: HTMLElement) => {
                    if (!optionEl.dataset.key) return;
                    root.$nextTick(() => root.$refs.__input?.focus({ preventScroll: true }));
                },
                mouseover: (optionEl: HTMLElement) => {
                    if (!optionEl.dataset.key) return;
                    root.__activate(optionEl.dataset.key);
                },
                mousemove: (optionEl: HTMLElement) => {
                    if (!optionEl.dataset.key || root.__isActive(optionEl.dataset.key)) return;
                    root.__activate(optionEl.dataset.key);
                },
                mouseout: () => {
                    if (root.__keepActivated) return;
                    root.__deactivate();
                }
            };

            Object.entries(events).forEach(([key, handler]) => {
                if (!disabledEvents.includes(key)) {
                    const delegate = (e: Event) => {
                        e.stopPropagation();
                        if (!(e.target instanceof Element)) return;
                        const optionEl = findClosestOption(e.target);
                        if (!optionEl) return;
                        handler(optionEl as HTMLElement);
                    };
                    optionsEl?.addEventListener(key, delegate);
                    cleanup.push(() => optionsEl?.removeEventListener(key, delegate));
                }
            });
        },
        destroy() {
            cleanup.forEach(fn => fn());
        }
    };
}
