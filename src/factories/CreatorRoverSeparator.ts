export const CSS_TEXT = `
    /* Hide separator if no \`hidden\` option after it */
    [data-slot=rover-separator]:has( +:is([data-slot=rover-option], [data-slot=rover-group]):is([style*="display: none"])) {
        display: none;
    }
    /* Hide separator if no \`hidden\` option before it */
    :is([data-slot=rover-option], [data-slot=rover-group])[style*="display: none"]+[data-slot=rover-separator] {
        display: none;
    }
`