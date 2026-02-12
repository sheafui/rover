export const input = () => ({
    __input() {
        let input: HTMLElement = queueMicrotask(() => { this.$refs.input });
        return {
            on(eventKey: string, handler: (event: KeyboardEvent, key: string | null) => void) {

            },

        }
    },
})