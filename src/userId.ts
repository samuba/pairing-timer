import { readable } from "svelte/store";

// have this in its own file so that while developing in store.ts HMR will not generate new ID for everytime that files is saved
const temp = new Date().toISOString();

export const userId = temp
