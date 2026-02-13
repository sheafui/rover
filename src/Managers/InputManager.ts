import { InputManager, RoverRootContext } from "../types"
import { bindListener } from "./utils"

export function createInputManager(
  root: RoverRootContext
): InputManager {
  const cleanup: (() => void)[] = []

  return {
    on<K extends keyof HTMLElementEventMap>(
      eventKey: K,
      handler: (
        event: HTMLElementEventMap[K],
        activeKey: string | null
      ) => void
    ) {
      root.$nextTick(() => {
        const inputEl = root.$refs.__input as HTMLInputElement | undefined
        if (!inputEl) return

        const listener = (event: HTMLElementEventMap[K]) => {
          const activeKey = root.__activatedKey ?? null
          handler(event, activeKey)
        }

        bindListener(inputEl, eventKey, listener, cleanup)
      })
    },

    get value(): string {
      const inputEl = root.$refs.__input as HTMLInputElement | undefined
      return inputEl ? inputEl.value : ""
    },

    set value(val: string) {
      root.$nextTick(() => {
        const inputEl = root.$refs.__input as HTMLInputElement | undefined
        if (inputEl) {
          inputEl.value = val
        }
      })
    },

    registerSharedEventListerns() {
      // example
      // this.on("keydown", (event) => { ... })
    },

    destroy() {
      cleanup.forEach(fn => fn())
    }
  }
}
