import { Alpine as AlpineType } from "alpinejs";
import { ComboboxInputData, ComboboxInputContext } from "src/types";

export default function CreateComboboxInput(Alpine: AlpineType): ComboboxInputData {

    return {
        init() {
            let displayValueFn = Alpine.extractProp(this.$el, 'display-value', '');

            if (displayValueFn) this.__displayValue = displayValueFn;

            this.__handleEvents();
        },

        __handleEvents(this: ComboboxInputContext) {

            this.$el.addEventListener('focus', () => {
                // on flat variant we need to activate the first key as
                //  soon as the user focus the input
                this.__startTyping();
            })

            this.$el.addEventListener('input', (e: InputEvent) => {
                e.stopPropagation();

                if (this.__isTyping) {
                    this.__open();
                }

            });

            this.$el.addEventListener('blur', () => {
                this.__stopTyping();
            });

            this.$el.addEventListener('keydown', (e: KeyboardEvent) => {

                switch (e.key) {
                    case 'ArrowDown':
                        e.preventDefault(); e.stopPropagation();

                        if (!this.__isOpen) {
                            this.__open()
                            break;
                        }

                        this.__activateNext();

                        break;

                    case 'ArrowUp':
                        e.preventDefault(); e.stopPropagation();

                        if (!this.__isOpen) {
                            this.__open()
                            break;
                        }

                        this.__activatePrev();
                        break;

                    case 'Enter':
                        e.preventDefault(); e.stopPropagation();

                        this.__selectActive()

                        this.__stopTyping()

                        if (!this.__isMultiple) {
                            this.__close()
                            this.__resetInput()
                        }
                        
                        break;
                }
            });
        },
    }
}