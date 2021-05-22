import { readable } from "svelte/store";

// window.name keeps value for lifetime of the tab
window.name = window.name || new Date().toISOString();
export const userId = window.name
