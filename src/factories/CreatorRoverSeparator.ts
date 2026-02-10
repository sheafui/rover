export const CSS_TEXT = `
    & ~ [data-slot="rover-option"] {
        display: none;
    }
    & ~ [data-slot="rover-option"][data-disabled="true"] {
        display: block;
    }
    & ~ [data-slot="rover-options-group"] {
        display: none;
    }
    & ~ [data-slot="rover-options-group"][data-disabled="true"] {
        display: block;
    }
    & ~ [data-slot="rover-separator"] {
        display: none;
    }
    & ~ [data-slot="rover-separator"][data-disabled="true"] {
        display: block;
    }
    &[data-disabled="true"] ~ [data-slot="rover-option"] {
        display: none;
    }
    &[data-disabled="true"] ~ [data-slot="rover-option"][data-disabled="true"] {
        display: block;
    }
    &[data-disabled="true"] ~ [data-slot="rover-options-group"] {
        display: none;
    }
    &[data-disabled="true"] ~ [data-slot="rover-options-group"][data-disabled="true"] {
        display: block;
    }
    &[data-disabled="true"] ~ [data-slot="rover-separator"] {
        display: none;
    }
    &[data-disabled="true"] ~ [data-slot="rover-separator"][data-disabled="true"] {
        display: block;
    }              
`