import { GM_xmlhttpRequest } from "$";
import { getCached, setCached } from '../adapters/cache';
import { log } from '../utils/logger'

interface GitHubRepo {
    id: number;
    name: string;
    repo: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    pushedAt: string;
    stars: number;
    watchers: number;
    forks: number;
    defaultBranch: string;
}

interface UnghRepoResponse {
    repo: GitHubRepo;
}

function isUnghRepoResponse(data: unknown): data is UnghRepoResponse {
    return (
        data !== null &&
        typeof data === 'object' &&
        'repo' in data &&
        typeof (data as UnghRepoResponse).repo === 'object' &&
        typeof (data as UnghRepoResponse).repo.createdAt === 'string'
    );
}

const INITIAL_BACKOFF_MS = 1_000; // 1 seconds

interface FailureState {
    failedAt: number;
    delay: number;
}

const failedKeys = new Map<string, FailureState>();

function recordFailure(cacheKey: string): void {
    const prev = failedKeys.get(cacheKey);
    const delay = prev ? prev.delay * 2 : INITIAL_BACKOFF_MS;
    failedKeys.set(cacheKey, { failedAt: Date.now(), delay });
    log(`Backoff for ${cacheKey}: next retry in ${delay / 1000}s`);
}

export async function getCreationDate(username: string, repo: string): Promise<string> {
    const cacheKey = `${username}/${repo}`;
    const cached = getCached(cacheKey);
    if (cached) {
        log(`cache found: ${cacheKey}: ${cached}`);
        return cached;
    }

    const failure = failedKeys.get(cacheKey);
    if (failure !== undefined && Date.now() - failure.failedAt < failure.delay) {
        log(`Skipping previously failed key (backoff active): ${cacheKey}`);
        return 'Unknown';
    }

    const apiUrl = `https://ungh.cc/repos/${username}/${repo}`;
    log('fetching API...', apiUrl);
    return new Promise((resolve) => {
        GM_xmlhttpRequest({
            method: 'GET',
            url: apiUrl,
            onload: (response: { status: number; statusText: string; responseText: string }) => {
                if (response.status !== 200) {
                    console.error('GitHub API error:', response.statusText);
                    recordFailure(cacheKey);
                    resolve('Unknown');
                    return;
                }
                try {
                    const data: unknown = JSON.parse(response.responseText);
                    if (isUnghRepoResponse(data)) {
                        setCached(cacheKey, data.repo.createdAt);
                        resolve(data.repo.createdAt);
                    } else {
                        console.error('Invalid response data:', data);
                        recordFailure(cacheKey);
                        resolve('Unknown');
                    }
                } catch (error) {
                    console.error('Error parsing response:', error);
                    recordFailure(cacheKey);
                    resolve('Unknown');
                }
            },
            onerror: (error: unknown) => {
                console.error('Network error:', error);
                recordFailure(cacheKey);
                resolve('Unknown');
            },
        });
    });
}