import { RoverCreateOptionContext, RoverCreateOptionData } from 'src/types';

export default function CreateRoverCreateOption(): RoverCreateOptionData {
    return {
        init(this: RoverCreateOptionContext) {
            queueMicrotask(() => {
                this.$el.dataset.active = 'true';
            })
        },
        destroy() {
            delete this.$el.dataset.active;
        },
        _x_activateCreateOptionEl() {

        }
    }
}