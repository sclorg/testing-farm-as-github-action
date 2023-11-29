import { summary } from '@actions/core';
import { Octokit } from '@octokit/core';
import * as fs from 'fs';
import path from 'path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import action from '../src/action';
import { NewRequest } from 'testing-farm';
import { PullRequest } from '../src/pull-request';

/**
 * Function which sets default Action inputs using environment variables and vi.stubEnv()
 */
function setDefaultInputs() {
  // api_url - A testing farm server url
  vi.stubEnv('INPUT_API_URL', 'https://api.dev.testing-farm.io');
  // git_ref - A tmt tests branch which will be used for tests
  vi.stubEnv('INPUT_GIT_REF', 'main');
  // compose - A compose to run tests against
  vi.stubEnv('INPUT_COMPOSE', 'Fedora-latest');
  // create_issue_comment - It creates a github issue Comment
  vi.stubEnv('INPUT_CREATE_ISSUE_COMMENT', 'false');
  // pull_request_status_name - GitHub pull request status name
  vi.stubEnv('INPUT_PULL_REQUEST_STATUS_NAME', 'Fedora');
  // variables - Environment variables for test, separated by ;
  vi.stubEnv('INPUT_VARIABLES', '');
  // secrets - Secret environment variables for test env, separated by ;
  vi.stubEnv('INPUT_SECRETS', '');
  // update_pull_request_status - Action will update pull request status. Default: true
  vi.stubEnv('INPUT_UPDATE_PULL_REQUEST_STATUS', 'true');
  // create_github_summary - Action will create github summary. Possible options: "false", "true", "key=value"
  vi.stubEnv('INPUT_CREATE_GITHUB_SUMMARY', 'true');
  // arch - Define an architecture for testing environment. Default: x86_64
  vi.stubEnv('INPUT_ARCH', 'x86_64');
  // copr - Name of copr to use for the artifacts
  vi.stubEnv('INPUT_COPR', 'epel-7-x86_64');
  // copr_artifacts - "fedora-copr-build" artifacts for testing environment. Separated by ;
  vi.stubEnv('INPUT_COPR_ARTIFACTS', '');
  // tmt_context - A value of tmt.context variable https://tmt.readthedocs.io/en/latest/spec/context.html, variables separated by ;
  vi.stubEnv('INPUT_TMT_CONTEXT', '');
  // tf_scope - Defines the scope of Testing Farm. Possible options are public and private
  vi.stubEnv('INPUT_TF_SCOPE', 'public');
  // environment_settings - Pass specific settings, like post-install-script, to the testing environment
  vi.stubEnv('INPUT_ENVIRONMENT_SETTINGS', '{}');
  // pr_head_sha - HEAD SHA of a Pull Request. Used for posting statuses to the PR. The value is obtained from `git rev-parse HEAD` if this input is not set
  vi.stubEnv('INPUT_PR_HEAD_SHA', '');
  // Action is waiting for testing farm to finish or until timeout is reached
  vi.stubEnv('INPUT_TIMEOUT', '480');
}

const mocks = vi.hoisted(() => {
  return {
    request: vi.fn(),
    newRequest: vi.fn(),
    requestDetails: vi.fn(),
    setTimeout: vi.fn(),
    TFError: vi.fn((message: string, url?: string | undefined) => {
      return {
        message,
        url,
      };
    }),
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
    newRequest: mocks.newRequest,
    requestDetails: mocks.requestDetails,
  }));
  return { default: TestingFarmAPI };
});

// Mock timers/promises module
// https://nodejs.org/docs/latest-v20.x/api/timers.html#timerspromisessettimeoutdelay-value-options
vi.mock('timers/promises', () => {
  return {
    setTimeout: mocks.setTimeout,
  };
});

// Mock @actions/core module
vi.mock('@actions/core', async () => {
  const actual = await vi.importActual('@actions/core');
  return {
    ...(actual as any),
    error: vi.fn(),
    setOutput: vi.fn().mockImplementation((name, value) => {
      process.env[`OUTPUT_${name.toUpperCase()}`] = value;
    }),
  };
});

vi.mock('../src/error.ts', async () => {
  return {
    TFError: mocks.TFError,
  };
});

// Mock summary write destination
const testDirectoryPath = path.join(__dirname, '');
const summaryPath = path.join(testDirectoryPath, 'test-summary.md');

async function assertSummary(expected: string): Promise<void> {
  const file = await fs.promises.readFile(summaryPath, { encoding: 'utf8' });
  expect(file).toEqual(expected);
}

describe('Integration tests', () => {
  beforeEach(async () => {
    // Mock setTimeout promise to resolve immediately
    vi.mocked(mocks.setTimeout).mockImplementation(async timeout => {
      return Promise.resolve();
    });

    // Mock Action environment
    vi.stubEnv('RUNNER_DEBUG', '1');
    vi.stubEnv('GITHUB_REPOSITORY', 'sclorg/testing-farm-as-github-action');
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

        case 'POST /repos/{owner}/{repo}/issues/{issue_number}/comments':
          return {
            status: 200,
            data: {},
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

    // Create test directory with test summary file
    // Taken from - https://github.com/actions/toolkit/blob/main/packages/core/__tests__/summary.test.ts
    vi.stubEnv('GITHUB_STEP_SUMMARY', summaryPath);
    await fs.promises.mkdir(testDirectoryPath, { recursive: true });
    await fs.promises.writeFile(summaryPath, '', { encoding: 'utf8' });
    summary.emptyBuffer();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    await fs.promises.unlink(summaryPath);
  });

  test('Minimal', async () => {
    setDefaultInputs();

    // Mock required Action inputs
    // api_key - A testing farm server api key
    vi.stubEnv('INPUT_API_KEY', 'abcdef-123456');
    // git_url - An url to the GIT repository
    vi.stubEnv(
      'INPUT_GIT_URL',
      'https://github.com/sclorg/testing-farm-as-github-action'
    );
    // tmt_plan_regex - A tmt plan regex which will be used for selecting plans. By default all plans are selected
    vi.stubEnv('INPUT_TMT_PLAN_REGEX', 'fedora');

    // Mock Testing Farm API
    vi.mocked(mocks.newRequest).mockImplementation(
      async (_request: NewRequest, _strict: boolean) => {
        return Promise.resolve({
          id: '1',
        });
      }
    );
    vi.mocked(mocks.requestDetails)
      .mockResolvedValueOnce({ state: 'new', result: null })
      .mockResolvedValueOnce({ state: 'queued', result: null })
      .mockResolvedValueOnce({ state: 'pending', result: null })
      .mockResolvedValueOnce({ state: 'running', result: null })
      .mockResolvedValueOnce({
        state: 'complete',
        result: { overall: 'passed', summary: '\\o/' },
      });

    // Run action
    const octokit = new Octokit({ auth: 'mock-token' });
    const pr = await PullRequest.initialize(1, octokit);

    await action(pr);

    // Check if we have waited for Testing Farm to finish
    expect(mocks.requestDetails).toHaveBeenCalledTimes(5);

    // Test outputs
    expect(process.env['OUTPUT_REQUEST_ID']).toMatchInlineSnapshot('"1"');
    expect(process.env['OUTPUT_REQUEST_URL']).toMatchInlineSnapshot(
      '"https://api.dev.testing-farm.io/requests/1"'
    );

    // First call to request PR details, next two calls for setting the status
    expect(mocks.request).toHaveBeenCalledTimes(3);

    // Test summary
    await assertSummary(`<h1>Testing Farm as a GitHub Action summary</h1>
<table><tr><th>Compose</th><th>Arch</th><th>Infrastructure State</th><th>Test result</th><th>Link to logs</th></tr><tr><td>${process.env['INPUT_COMPOSE']}</td><td>${process.env['INPUT_ARCH']}</td><td>OK</td><td>success</td><td>[https://artifacts.dev.testing-farm.io/1/pipeline.log](pipeline.log)</td></tr></table>
`);

    expect(mocks.TFError).not.toHaveBeenCalled();
  });

  test.todo('Failed test/error', async () => {});

  test('Testing Farm request details timeout', async () => {
    setDefaultInputs();

    // Mock required Action inputs
    // api_key - A testing farm server api key
    vi.stubEnv('INPUT_API_KEY', 'abcdef-123456');
    // git_url - An url to the GIT repository
    vi.stubEnv(
      'INPUT_GIT_URL',
      'https://github.com/sclorg/testing-farm-as-github-action'
    );
    // tmt_plan_regex - A tmt plan regex which will be used for selecting plans. By default all plans are selected
    vi.stubEnv('INPUT_TMT_PLAN_REGEX', 'fedora');
    // Action is waiting for testing farm to finish or until timeout is reached
    // set timeout to 1 to trigger timeout error after 2 requests
    vi.stubEnv('INPUT_TIMEOUT', '1');

    // Mock Testing Farm API
    vi.mocked(mocks.newRequest).mockImplementation(
      async (_request: NewRequest, _strict: boolean) => {
        return Promise.resolve({
          id: '1',
        });
      }
    );
    vi.mocked(mocks.requestDetails)
      .mockResolvedValueOnce({ state: 'new', result: null })
      .mockResolvedValueOnce({ state: 'queued', result: null })
      .mockResolvedValueOnce({ state: 'pending', result: null })
      .mockResolvedValueOnce({ state: 'running', result: null })
      .mockResolvedValueOnce({
        state: 'complete',
        result: { overall: 'passed', summary: '\\o/' },
      });

    // Run action
    const octokit = new Octokit({ auth: 'mock-token' });
    const pr = await PullRequest.initialize(1, octokit);

    try {
      await action(pr);
    } catch (error) {
      expect(error).toMatchInlineSnapshot(`
        {
          "message": "Testing Farm - timeout reached. The test is still in state: 'queued'",
          "url": "https://artifacts.dev.testing-farm.io/1",
        }
      `);
    }

    expect(mocks.TFError).toHaveBeenCalled();

    // Check if we have waited for Testing Farm to finish
    expect(mocks.requestDetails).toHaveBeenCalledTimes(2);

    // First call to request PR details, next call for setting the status to pending
    // TODO: Check if we set the status to error (it's done in main.ts)
    expect(mocks.request).toHaveBeenCalledTimes(2);

    // Test summary
    // When timeout is reached, the summary is currently empty
    await assertSummary(``);
  });
});
