import { GM_getValue, GM_setValue, GM_xmlhttpRequest } from '$';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getCreationDate } from './githubRepo';

type Response = { status: number; statusText: string; responseText: string };
type Handlers = { url: string; onload: (r: Response) => void; onerror: (e: unknown) => void };

const CREATED_AT = '2020-01-05T10:00:00.000Z';
const ok = (body: unknown): Response => ({
  status: 200,
  statusText: 'OK',
  responseText: JSON.stringify(body),
});

function respondWith(response: Response) {
  vi.mocked(GM_xmlhttpRequest).mockImplementation(((opts: Handlers) =>
    opts.onload(response)) as never);
}

function failWithNetworkError() {
  vi.mocked(GM_xmlhttpRequest).mockImplementation(((opts: Handlers) =>
    opts.onerror(new Error('offline'))) as never);
}

// Backoff state lives at module scope and persists across tests, so every test
// gets its own repo name instead of reloading the module (which would also
// give the service a different instance of the mocked "$" module).
let seq = 0;
let repo = '';

describe('getCreationDate', () => {
  beforeEach(() => {
    repo = `repo-${seq++}`;
    vi.mocked(GM_getValue).mockReset().mockReturnValue(null);
    vi.mocked(GM_setValue).mockReset();
    vi.mocked(GM_xmlhttpRequest).mockReset();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('returns the cached value without hitting the network', async () => {
    vi.mocked(GM_getValue).mockReturnValue(CREATED_AT);

    await expect(getCreationDate('user', repo)).resolves.toBe(CREATED_AT);
    expect(GM_xmlhttpRequest).not.toHaveBeenCalled();
  });

  it('fetches from ungh, returns createdAt and caches it', async () => {
    respondWith(ok({ repo: { createdAt: CREATED_AT } }));

    await expect(getCreationDate('user', repo)).resolves.toBe(CREATED_AT);
    expect(GM_xmlhttpRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', url: `https://ungh.cc/repos/user/${repo}` }),
    );
    expect(GM_setValue).toHaveBeenCalledWith(`creationDate:user/${repo}`, CREATED_AT);
  });

  it.each([
    ['non-200 status', { status: 404, statusText: 'Not Found', responseText: '' }],
    ['malformed JSON', { status: 200, statusText: 'OK', responseText: '<html>' }],
    ['missing repo key', ok({ nope: true })],
    ['null repo', ok({ repo: null })],
    ['non-string createdAt', ok({ repo: { createdAt: 123 } })],
    ['null body', ok(null)],
  ])('returns "Unknown" and does not cache on %s', async (_name, response) => {
    respondWith(response);

    await expect(getCreationDate('user', repo)).resolves.toBe('Unknown');
    expect(GM_setValue).not.toHaveBeenCalled();
  });

  it('returns "Unknown" on network error', async () => {
    failWithNetworkError();

    await expect(getCreationDate('user', repo)).resolves.toBe('Unknown');
    expect(GM_setValue).not.toHaveBeenCalled();
  });

  describe('failure backoff', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    });

    it('skips the network while backoff is active, then retries with a doubled delay', async () => {
      failWithNetworkError();
      const calls = () => vi.mocked(GM_xmlhttpRequest).mock.calls.length;

      await getCreationDate('user', repo); // fail #1 -> 1s backoff
      expect(calls()).toBe(1);

      await getCreationDate('user', repo); // inside window
      expect(calls()).toBe(1);

      vi.advanceTimersByTime(1_001);
      await getCreationDate('user', repo); // retry, fail #2 -> 2s backoff
      expect(calls()).toBe(2);

      vi.advanceTimersByTime(1_500); // 1.5s < 2s
      await getCreationDate('user', repo);
      expect(calls()).toBe(2);

      vi.advanceTimersByTime(600); // 2.1s total
      await getCreationDate('user', repo);
      expect(calls()).toBe(3);
    });

    it('tracks backoff per repo', async () => {
      failWithNetworkError();

      await getCreationDate('user', `${repo}-broken`);
      respondWith(ok({ repo: { createdAt: CREATED_AT } }));

      await expect(getCreationDate('user', `${repo}-healthy`)).resolves.toBe(CREATED_AT);
    });

    it('recovers and caches after a successful retry', async () => {
      failWithNetworkError();

      await getCreationDate('user', repo);
      vi.advanceTimersByTime(1_001);
      respondWith(ok({ repo: { createdAt: CREATED_AT } }));

      await expect(getCreationDate('user', repo)).resolves.toBe(CREATED_AT);
      expect(GM_setValue).toHaveBeenCalledWith(`creationDate:user/${repo}`, CREATED_AT);
    });
  });
});
