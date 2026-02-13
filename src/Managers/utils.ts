export function bindListener<
    K extends keyof HTMLElementEventMap
>(
    el: HTMLElement,
    eventKey: K,
    listener: (event: HTMLElementEventMap[K]) => void,
    cleanup: (() => void)[]
) {
    el.addEventListener(eventKey, listener)

    cleanup.push(() => {
        el.removeEventListener(eventKey, listener)
    })
}
