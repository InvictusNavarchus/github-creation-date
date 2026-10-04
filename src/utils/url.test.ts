import { describe, expect, it } from 'vitest';
import { extractUsernameAndRepo, isGithubRepoPathname } from './url';

describe('isGithubRepoPathname', () => {
  it.each(['/vitest-dev/vitest', '/a/b', '/user/repo.js', '/user/my-repo_1'])(
    'accepts %s',
    (path) => {
      expect(isGithubRepoPathname(path)).toBe(true);
    },
  );

  it.each(['/settings/profile', '/topics/typescript', '/organizations/new'])(
    'rejects reserved top-level name %s',
    (path) => {
      expect(isGithubRepoPathname(path)).toBe(false);
    },
  );

  it.each([
    ['root', '/'],
    ['empty', ''],
    ['user profile', '/user'],
    ['sub page', '/user/repo/issues'],
    ['deep path', '/user/repo/blob/main/README.md'],
  ])('rejects non-repo path: %s', (_name, path) => {
    expect(isGithubRepoPathname(path)).toBe(false);
  });

  it('rejects a trailing slash', () => {
    // "/user/repo/" splits into 4 segments (last one empty)
    expect(isGithubRepoPathname('/user/repo/')).toBe(false);
  });
});

describe('extractUsernameAndRepo', () => {
  it('returns username and repo for a repo path', () => {
    expect(extractUsernameAndRepo('/vitest-dev/vitest')).toEqual({
      username: 'vitest-dev',
      repo: 'vitest',
    });
  });

  it('returns null for non-repo paths', () => {
    expect(extractUsernameAndRepo('/')).toBeNull();
    expect(extractUsernameAndRepo('/settings/profile')).toBeNull();
    expect(extractUsernameAndRepo('/user/repo/issues')).toBeNull();
  });
});
