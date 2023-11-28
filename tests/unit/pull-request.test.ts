/** This file contains unit tests for Pull Request class.
 * vitest general documentation - https://vitest.dev/
 * vi API documentation (mocking) - https://vitest.dev/api/vi.html#vi
 */
import { Octokit } from '@octokit/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PullRequest } from '../../src/pull-request';
import { afterEach } from 'node:test';

const octokit = {
  request: (
    endpoint: string,
    request: {
      owner: string;
      repo: string;
      pull_number?: number;
      issue_number?: number;
      body?: string;
    }
  ) => {
    switch (endpoint) {
      case 'GET /repos/{owner}/{repo}/pulls/{pull_number}':
        expect(request).toMatchInlineSnapshot(`
          {
            "owner": "sclorg",
            "pull_number": 1,
            "repo": "testing-farm-as-github-action",
          }
        `);

        return {
          status: 200,
          data: {
            number: request.pull_number,
            head: { sha: 'd20d0c37d634a5303fa1e02edc9ea281897ba01a' },
          },
        };

      case 'POST /repos/{owner}/{repo}/issues/{issue_number}/comments':
        expect(request).toMatchInlineSnapshot(`
            {
              "body": "some comment",
              "issue_number": 1,
              "owner": "sclorg",
              "repo": "testing-farm-as-github-action",
            }
          `);

        return {
          status: 200,
          data: {},
        };

      case 'POST /repos/{owner}/{repo}/statuses/{sha}':
        expect(request).toMatchInlineSnapshot(`
          {
            "context": "Testing Farm - Fedora",
            "description": "some description",
            "owner": "sclorg",
            "repo": "testing-farm-as-github-action",
            "sha": "d20d0c37d634a5303fa1e02edc9ea281897ba01a",
            "state": "success",
            "target_url": "some url",
          }
        `);

        return {
          status: 200,
          data: {},
        };

      default:
        throw new Error(`Unexpected endpoint: ${endpoint}`);
    }
  },
} as unknown as Octokit;

interface TestContext {
  pr: PullRequest;
}

describe('Pull Request class', () => {
  beforeEach<TestContext>(async context => {
    // populate context.repo object
    vi.stubEnv('GITHUB_REPOSITORY', 'sclorg/testing-farm-as-github-action');
    // simulate pull_request_status_name input
    vi.stubEnv('INPUT_PULL_REQUEST_STATUS_NAME', 'Fedora');

    context.pr = await PullRequest.initialize(1, octokit);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it<TestContext>('can be instantiated', async context => {
    expect(context.pr).toBeDefined();
    expect(context.pr).toBeInstanceOf(PullRequest);
    expect(context.pr.number).toBe(1);
    expect(context.pr.sha).toBe('d20d0c37d634a5303fa1e02edc9ea281897ba01a');
  });

  it<TestContext>('can create comment', async context => {
    await context.pr.addComment('some comment');
  });

  it<TestContext>('can set status', async context => {
    await context.pr.setStatus('success', 'some description', 'some url');
  });
});
