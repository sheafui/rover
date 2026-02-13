export function bindListener<
    K extends keyof HTMLElementEventMap
>(
    el: HTMLElement,
    eventKey: K,
    listener: (event: HTMLElementEventMap[K]) => void,
    controller: AbortController
) {
    el.addEventListener(eventKey, listener, {
        signal: controller.signal
    })
}
