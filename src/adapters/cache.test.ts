import { GM_getValue, GM_setValue } from '$';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCached, setCached } from './cache';

describe('cache adapter', () => {
  beforeEach(() => {
    vi.mocked(GM_getValue).mockReset();
    vi.mocked(GM_setValue).mockReset();
  });

  it('reads with a namespaced key and null default', () => {
    vi.mocked(GM_getValue).mockReturnValue('2020-01-05T00:00:00Z');
    expect(getCached('user/repo')).toBe('2020-01-05T00:00:00Z');
    expect(GM_getValue).toHaveBeenCalledWith('creationDate:user/repo', null);
  });

  it('returns null when nothing is stored', () => {
    vi.mocked(GM_getValue).mockReturnValue(null);
    expect(getCached('user/repo')).toBeNull();
  });

  it('normalises undefined to null', () => {
    vi.mocked(GM_getValue).mockReturnValue(undefined);
    expect(getCached('user/repo')).toBeNull();
  });

  it('writes with a namespaced key', () => {
    setCached('user/repo', '2020-01-05T00:00:00Z');
    expect(GM_setValue).toHaveBeenCalledWith('creationDate:user/repo', '2020-01-05T00:00:00Z');
  });
});
