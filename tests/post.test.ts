import { Octokit } from '@octokit/core';
import { NewRequest } from 'testing-farm';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import post from '../src/post';
import { PullRequest } from '../src/pull-request';

/**
 * Function which sets default Action inputs using environment variables and vi.stubEnv()
 */
function setDefaultInputs() {
  // api_url - A testing farm server url
  vi.stubEnv('INPUT_API_URL', 'https://api.dev.testing-farm.io');
  // pull_request_status_name - GitHub pull request status name
  vi.stubEnv('INPUT_PULL_REQUEST_STATUS_NAME', 'Fedora');
}

const mocks = vi.hoisted(() => {
  return {
    request: vi.fn(),
    cancelRequest: vi.fn(),
    getState: vi.fn(),
  };
});

// Mock @octokit/core module
vi.mock('@octokit/core', () => {
  const Octokit = vi.fn(() => ({
    request: mocks.request,
  }));
  return { Octokit };
});

// Mock testing-farm module
vi.mock('testing-farm', async () => {
  const TestingFarmAPI = vi.fn(() => ({
    cancelRequest: mocks.cancelRequest,
  }));
  return { default: TestingFarmAPI };
});

// Mock @actions/core module
vi.mock('@actions/core', async () => {
  const actual = await vi.importActual('@actions/core');
  return {
    ...(actual as any),
    saveState: vi.fn().mockImplementation((name, value) => {
      vi.stubEnv(`STATE_${name.toUpperCase()}`, value);
    }),
    getState: mocks.getState,
  };
});

// Mock @actions/github module
vi.mock('@actions/github', async () => {
  const actual = await vi.importActual('@actions/github');
  return {
    ...(actual as any),
    context: {
      repo: {
        owner: 'sclorg',
        repo: 'testing-farm-as-github-action',
      },
      runId: 123456,
    },
  };
});

describe('Integration tests - post.ts', () => {
  beforeEach(() => {
    // Mock Action environment
    vi.stubEnv('RUNNER_DEBUG', '1');
    vi.stubEnv('GITHUB_REPOSITORY', 'sclorg/testing-farm-as-github-action');
    vi.stubEnv('GITHUB_RUN_ID', '123456');
    vi.stubEnv('INPUT_GITHUB_TOKEN', 'mock-token');

    // Mock GitHub API
    vi.mocked(mocks.request).mockImplementation(path => {
      switch (path) {
        case 'GET /repos/{owner}/{repo}/pulls/{pull_number}':
          return {
            status: 200,
            data: {
              number: 1,
              head: { sha: 'd20d0c37d634a5303fa1e02edc9ea281897ba01a' },
            },
          };

        case 'POST /repos/{owner}/{repo}/statuses/{sha}':
          return {
            status: 200,
            data: {},
          };

        case 'GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs':
          return {
            status: 200,
            data: {
              jobs: [
                {
                  name: 'test-job',
                  status: 'in_progress',
                  started_at: new Date().toISOString(),
                  steps: [
                    {
                      conclusion: 'cancelled',
                    },
                  ],
                },
              ],
            },
          };

        default:
          throw new Error(`Unexpected endpoint: ${path}`);
      }
    });

    // Mock Testing Farm API
    vi.mocked(mocks.cancelRequest).mockImplementation(
      async (_request: NewRequest, _strict: boolean) => {
        return Promise.resolve();
      }
    );

    // Mock getState
    vi.mocked(mocks.getState).mockImplementation(name => {
      return process.env[`STATE_${name.toUpperCase()}`];
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  test('Successful Post run', async () => {
    setDefaultInputs();

    // Mock required Action inputs
    // api_key - A testing farm server api key
    vi.stubEnv('INPUT_API_KEY', 'abcdef-123456');
    // update_pull_request_status - Action will update pull request status. Default: false
    vi.stubEnv('INPUT_UPDATE_PULL_REQUEST_STATUS', 'true');

    // Mock States
    vi.stubEnv('STATE_REQUESTID', '1');
    vi.stubEnv(
      'STATE_ARTIFACTURL',
      'https://artifacts.dev.testing-farm.io/1/pipeline.log'
    );

    // Run post
    const octokit = new Octokit({ auth: 'mock-token' });
    const pr = await PullRequest.initialize(1, octokit);

    await post(pr, octokit);

    // Check if we have cancelled the TF test request
    expect(mocks.cancelRequest).toHaveBeenCalledOnce();

    // First call to check if job was cancelled by Runner, then to request PR details and finally call for setting the status
    expect(mocks.request).toHaveBeenCalledTimes(3);
    expect(mocks.request).toHaveBeenLastCalledWith(
      'POST /repos/{owner}/{repo}/statuses/{sha}',
      {
        context: 'Testing Farm - Fedora',
        description: 'Testing Farm request was cancelled',
        owner: 'sclorg',
        repo: 'testing-farm-as-github-action',
        sha: 'd20d0c37d634a5303fa1e02edc9ea281897ba01a',
        state: 'success',
        target_url: 'https://artifacts.dev.testing-farm.io/1/pipeline.log',
      }
    );
  });

  test('Running in non pull_request like context', async () => {
    setDefaultInputs();

    // Mock required Action inputs
    // api_key - A testing farm server api key
    vi.stubEnv('INPUT_API_KEY', 'abcdef-123456');
    // update_pull_request_status - Action will update pull request status. Default: false
    vi.stubEnv('INPUT_UPDATE_PULL_REQUEST_STATUS', 'true');

    // Mock States
    vi.stubEnv('STATE_REQUESTID', '1');
    vi.stubEnv(
      'STATE_ARTIFACTURL',
      'https://artifacts.dev.testing-farm.io/1/pipeline.log'
    );

    // Run post
    const octokit = new Octokit({ auth: 'mock-token' });
    const pr = new PullRequest(undefined, undefined, octokit);

    await post(pr, octokit);

    // Check if we have cancelled the TF test request
    expect(mocks.cancelRequest).toHaveBeenCalledOnce();

    // Only call to check if job was cancelled by Runner, since action doesn't have access to Pull Request context it won't set the status nor create a comment
    expect(mocks.request).toHaveBeenCalledOnce();
    expect(mocks.request).toHaveBeenLastCalledWith(
      'GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs',
      {
        owner: 'sclorg',
        repo: 'testing-farm-as-github-action',
        run_id: 123456,
      }
    );
  });

  test('Post run before TF test was requested', async () => {
    setDefaultInputs();

    // Mock required Action inputs
    // api_key - A testing farm server api key
    vi.stubEnv('INPUT_API_KEY', 'abcdef-123456');
    // update_pull_request_status - Action will update pull request status. Default: false
    vi.stubEnv('INPUT_UPDATE_PULL_REQUEST_STATUS', 'true');

    // Mock Testing Farm API
    vi.mocked(mocks.cancelRequest).mockImplementation(
      async (_request: NewRequest, _strict: boolean) => {
        return Promise.resolve();
      }
    );

    // Run post
    const octokit = new Octokit({ auth: 'mock-token' });
    const pr = await PullRequest.initialize(1, octokit);

    try {
      await post(pr, octokit);
    } catch (error) {
      expect(error).toMatchInlineSnapshot(
        '[Error: POST: Missing Testing Farm request id]'
      );
    }

    expect(mocks.request).toHaveBeenCalledTimes(2);
  });
});
