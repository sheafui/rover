import combobox from '../src/index'

const plugin = (Alpine) => {
    combobox(Alpine);
}

document.addEventListener('alpine:init', () => {

    console.log('dede')
    
    Alpine.directive('test',(el, { value, modifiers, expression }, { Alpine, effect })=>{
        console.log('dede')
    })

    window.Alpine.de
    window.Alpine.plugin(plugin);
})
