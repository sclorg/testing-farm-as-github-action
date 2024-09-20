/** This file contains unit tests for Pull Request class.
 * vitest general documentation - https://vitest.dev/
 * vi API documentation (mocking) - https://vitest.dev/api/vi.html#vi
 */
import { Octokit } from '@octokit/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PullRequest } from '../../src/pull-request';
import { CustomContext } from '../../src/context';

const mocks = vi.hoisted(() => {
  return {
    request: vi.fn(),
  };
});

// Mock @octokit/core module
vi.mock('@octokit/core', () => {
  const Octokit = vi.fn(() => ({
    request: mocks.request,
  }));
  return { Octokit };
});

vi.mock('issue-metadata', () => {
  const MetadataController = vi.fn(() => {
    return {
      getMetadata: vi.fn(() => {
        return {
          commentID: undefined,
          data: [],
        };
      }),
    };
  });

  return { default: MetadataController };
});

interface TestContext {
  pr: PullRequest;
}

describe('Pull Request class', () => {
  beforeEach<TestContext>(async context => {
    vi.stubEnv('INPUT_GITHUB_TOKEN', 'mock_token');
    // populate context.repo object
    vi.stubEnv('GITHUB_REPOSITORY', 'sclorg/testing-farm-as-github-action');
    // simulate pull_request_status_name input
    vi.stubEnv('INPUT_PULL_REQUEST_STATUS_NAME', 'Fedora');
    // simulate update_pull_request_status
    vi.stubEnv('INPUT_UPDATE_PULL_REQUEST_STATUS', 'true');

    // mock the pull request number in the context
    vi.stubEnv('INPUT_PR_NUMBER', '1');
    vi.stubEnv('INPUT_COMMIT_SHA', 'd20d0c37d634a5303fa1e02edc9ea281897ba01a');

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

        case 'POST /repos/{owner}/{repo}/issues/{issue_number}/comments':
          return {
            status: 200,
            data: {
              id: 1,
            },
          };

        case 'POST /repos/{owner}/{repo}/statuses/{sha}':
          return {
            status: 200,
            data: {},
          };

        default:
          throw new Error(`Unexpected endpoint: ${path}`);
      }
    });

    context.pr = await PullRequest.initialize(
      new CustomContext(),
      new Octokit()
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it<TestContext>('can be instantiated', async context => {
    expect(context.pr).toBeDefined();
    expect(context.pr).toBeInstanceOf(PullRequest);
    expect(context.pr.number).toBe(1);
    expect(context.pr.sha).toBe('d20d0c37d634a5303fa1e02edc9ea281897ba01a');
  });

  it<TestContext>('can create comment', async context => {
    await context.pr.createComment('some comment');
  });

  it<TestContext>('can set status', async context => {
    await context.pr.setStatus('success', 'some description', 'some url');
  });
});
