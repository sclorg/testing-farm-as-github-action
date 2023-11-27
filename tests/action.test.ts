import { error, summary } from '@actions/core';
import { Octokit } from '@octokit/core';
import * as fs from 'fs';
import path from 'path';
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest';

import action from '../src/action';
import { NewRequest } from 'testing-farm';

const mocks = vi.hoisted(() => {
  return {
    request: vi.fn(),
    newRequest: vi.fn(),
    requestDetails: vi.fn(),
    setTimeout: vi.fn(),
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

// Mock summary write destination
const testDirectoryPath = path.join(__dirname, '');
const summaryPath = path.join(testDirectoryPath, 'test-summary.md');

async function assertSummary(expected: string): Promise<void> {
  const file = await fs.promises.readFile(summaryPath, { encoding: 'utf8' });
  expect(file).toEqual(expected);
}

describe('Integration test', () => {
  beforeEach(async () => {
    // Mock setTimeout promise to resolve immediately
    vi.mocked(mocks.setTimeout).mockImplementation(async timeout => {
      return Promise.resolve();
    });

    // Create test directory with test summary file
    // Taken from - https://github.com/actions/toolkit/blob/main/packages/core/__tests__/summary.test.ts
    vi.stubEnv('GITHUB_STEP_SUMMARY', summaryPath);
    await fs.promises.mkdir(testDirectoryPath, { recursive: true });
    await fs.promises.writeFile(summaryPath, '', { encoding: 'utf8' });
    summary.emptyBuffer();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  afterAll(async () => {
    await fs.promises.unlink(summaryPath);
  });

  test('General use case', async () => {
    // Mock Action environment
    vi.stubEnv('RUNNER_DEBUG', '1');
    vi.stubEnv('GITHUB_REPOSITORY', 'sclorg/testing-farm-as-github-action');
    vi.stubEnv('INPUT_GITHUB_TOKEN', 'mock-token');

    // Mock Action inputs
    // api_url - A testing farm server url
    vi.stubEnv('INPUT_API_URL', 'https://api.dev.testing-farm.io');
    // api_key - A testing farm server api key
    vi.stubEnv('INPUT_API_KEY', 'abcdef-123456');
    // git_url - An url to the GIT repository
    vi.stubEnv(
      'INPUT_GIT_URL',
      'https://github.com/sclorg/testing-farm-as-github-action'
    );
    // git_ref - A tmt tests branch which will be used for tests
    vi.stubEnv('INPUT_GIT_REF', 'main');
    // tmt_plan_regex - A tmt plan regex which will be used for selecting plans. By default all plans are selected
    vi.stubEnv('INPUT_TMT_PLAN_REGEX', 'fedora');
    // compose - A compose to run tests against
    vi.stubEnv('INPUT_COMPOSE', 'Fedora-latest');
    // create_issue_comment - It creates a github issue Comment
    vi.stubEnv('INPUT_CREATE_ISSUE_COMMENT', 'true');
    // pull_request_status_name - GitHub pull request status name
    vi.stubEnv('INPUT_PULL_REQUEST_STATUS_NAME', 'Fedora');
    // variables - Environment variables for test, separated by ;
    vi.stubEnv(
      'INPUT_VARIABLES',
      'REPO_URL=GITHUB_SERVER_URL/GITHUB_REPOSITORY;REPO_NAME=GITHUB_REPOSITORY'
    );
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

    // Mock Testing Farm API
    vi.mocked(mocks.newRequest).mockImplementation(
      async (_request: NewRequest, _strict: boolean) => {
        return Promise.resolve({
          id: '1',
        });
      }
    );
    vi.mocked(mocks.requestDetails)
      .mockResolvedValueOnce({
        state: 'new',
        result: { overall: '', summary: null },
      })
      .mockResolvedValueOnce({
        state: 'queued',
        result: { overall: '', summary: null },
      })
      .mockResolvedValueOnce({
        state: 'pending',
        result: { overall: '', summary: null },
      })
      .mockResolvedValueOnce({
        state: 'running',
        result: { overall: '', summary: null },
      })
      .mockResolvedValueOnce({
        state: 'complete',
        result: { overall: 'passed', summary: '\\o/' },
      });

    // Run action
    await action(
      new Octokit({
        auth: 'mock-token',
      })
    );

    // Check if we have waited for Testing Farm to finish
    expect(mocks.requestDetails).toHaveBeenCalledTimes(5);

    // Test outputs
    expect(process.env['OUTPUT_REQUEST_ID']).toMatchInlineSnapshot('"1"');
    expect(process.env['OUTPUT_REQUEST_URL']).toMatchInlineSnapshot(
      '"https://api.dev.testing-farm.io/requests/1"'
    );

    // Test summary
    await assertSummary(`<h1>Testing Farm as a GitHub Action summary</h1>
<table><tr><th>Compose</th><th>Arch</th><th>Infrastructure State</th><th>Test result</th><th>Link to logs</th></tr><tr><td>${process.env['INPUT_COMPOSE']}</td><td>${process.env['INPUT_ARCH']}</td><td>OK</td><td>success</td><td>https://artifacts.dev.testing-farm.io/1/pipeline.log</td></tr></table>
`);

    expect(error).not.toHaveBeenCalled();
  });
});
