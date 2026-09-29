import browser from 'webextension-polyfill';

/** The only browser API import allowed outside this adapter. */
export type BrowserApi = typeof browser;

export default browser;
