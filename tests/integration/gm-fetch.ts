// Integration-test stand-in for the "$" module. GM_xmlhttpRequest is backed by
// Node's real fetch, so the service code hits the real network unchanged.
export const store = new Map<string, unknown>();

export function GM_getValue<T>(key: string, defaultValue: T): T {
  return store.has(key) ? (store.get(key) as T) : defaultValue;
}

export function GM_setValue(key: string, value: unknown): void {
  store.set(key, value);
}

interface RequestOptions {
  method?: string;
  url: string;
  onload: (response: { status: number; statusText: string; responseText: string }) => void;
  onerror: (error: unknown) => void;
}

export function GM_xmlhttpRequest({ method = 'GET', url, onload, onerror }: RequestOptions): void {
  fetch(url, { method })
    .then(async (res) =>
      onload({ status: res.status, statusText: res.statusText, responseText: await res.text() }),
    )
    .catch(onerror);
}
