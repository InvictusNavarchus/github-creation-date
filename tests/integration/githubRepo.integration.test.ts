import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCreationDate } from '../../src/services/githubRepo';
import { store } from './gm-fetch';

// Real network calls to https://ungh.cc.
describe('getCreationDate (real ungh.cc API)', () => {
  beforeEach(() => {
    store.clear();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('returns the real creation date of a known repo and caches it', async () => {
    const date = await getCreationDate('vitest-dev', 'vitest');

    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(Number.isNaN(new Date(date).getTime())).toBe(false);
    expect(new Date(date).getUTCFullYear()).toBe(2021);
    expect(store.get('creationDate:vitest-dev/vitest')).toBe(date);
  });

  it('serves the second call from cache', async () => {
    const first = await getCreationDate('vitest-dev', 'vitest');

    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const second = await getCreationDate('vitest-dev', 'vitest');

    expect(second).toBe(first);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns "Unknown" for a repo that does not exist', async () => {
    const date = await getCreationDate('vitest-dev', 'this-repo-does-not-exist-0000');

    expect(date).toBe('Unknown');
    expect(store.size).toBe(0);
  });
});
