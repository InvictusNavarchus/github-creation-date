import { vi } from 'vitest';

// Unit-test stand-in for the "$" module (vite-plugin-monkey GM_* APIs).
export const GM_getValue = vi.fn();
export const GM_setValue = vi.fn();
export const GM_xmlhttpRequest = vi.fn();
