import { summary } from '@actions/core';
import { Octokit } from '@octokit/core';
import * as fs from 'fs';
import path from 'path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import action from '../src/action';
import { CustomContext } from '../src/context';
import { NewRequest } from 'testing-farm';
import { PullRequest } from '../src/pull-request';
import { Metadata } from '../src/metadata';

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
  // update_pull_request_status - Action will update pull request status. Default: false
  vi.stubEnv('INPUT_UPDATE_PULL_REQUEST_STATUS', 'false');
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
  // tmt_path - A path in the repository with tmt metadata
  vi.stubEnv('INPUT_TMT_PATH', '.');
  // tf_scope - Defines the scope of Testing Farm. Possible options are public and private
  vi.stubEnv('INPUT_TF_SCOPE', 'public');
  // environment_settings - Pass specific settings, like post-install-script, to the testing environment
  vi.stubEnv('INPUT_ENVIRONMENT_SETTINGS', '{}');
  // pipeline_settings - Pass specific settings for the testing farm pipeline, e.g. the type for multihost testing
  vi.stubEnv('INPUT_PIPELINE_SETTINGS', '{}');
  // Action is waiting for testing farm to finish or until timeout is reached
  vi.stubEnv('INPUT_TIMEOUT', '480');

  // Set default timezone to UTC - used by GitHub Runners
  vi.stubEnv('TZ', 'UTC');
}

const mocks = vi.hoisted(() => {
  return {
    request: vi.fn(),
    newRequest: vi.fn(),
    unsafeNewRequest: vi.fn(),
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
    unsafeNewRequest: mocks.unsafeNewRequest,
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
    saveState: vi.fn().mockImplementation((name, value) => {
      vi.stubEnv(`STATE_${name.toUpperCase()}`, value);
    }),
    getState: vi.fn().mockImplementation(name => {
      return process.env[`STATE_${name.toUpperCase()}`];
    }),
  };
});

vi.mock('issue-metadata', () => {
  const MetadataController = vi.fn(() => {
    return {
      setMetadata: vi.fn(),
      getMetadata: vi.fn(() => {
        return {
          commentID: undefined,
          data: [],
          lock: 'false',
        };
      }),
    };
  });

  return { default: MetadataController };
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

describe('Integration tests - action.ts', () => {
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

    // mock the pull request number and sha in the context
    vi.stubEnv('INPUT_PR_NUMBER', '1');
    vi.stubEnv('INPUT_COMMIT_SHA', 'd20d0c37d634a5303fa1e02edc9ea281897ba01a');

    // Mock Testing Farm API
    vi.mocked(mocks.newRequest).mockImplementation(
      async (_request: NewRequest, _strict: boolean) => {
        return Promise.resolve({
          id: '1',
          state: 'new',
          created: '2021-08-24T14:15:22Z',
          updated: '2021-08-24T14:15:22Z',
        });
      }
    );
    vi.mocked(mocks.requestDetails)
      .mockResolvedValueOnce({
        id: '1',
        state: 'new',
        result: null,
        run_time: 1,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'queued',
        result: null,
        run_time: 61,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'pending',
        result: null,
        run_time: 121,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'running',
        result: null,
        run_time: 181,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'complete',
        result: { overall: 'passed', summary: '\\o/' },
        run_time: 3691,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      });

    // Run action
    const octokit = new Octokit({ auth: 'mock-token' });
    const pr = await PullRequest.initialize(new CustomContext(), octokit);

    await action(pr);

    // hardware reguest has not been called
    expect(mocks.unsafeNewRequest).not.toHaveBeenCalled();

    // Check if we have waited for Testing Farm to finish
    expect(mocks.requestDetails).toHaveBeenCalledTimes(5);

    // Test outputs
    expect(process.env['OUTPUT_REQUEST_ID']).toMatchInlineSnapshot('"1"');
    expect(process.env['OUTPUT_REQUEST_URL']).toMatchInlineSnapshot(
      '"https://api.dev.testing-farm.io/requests/1"'
    );
    expect(process.env['OUTPUT_TEST_LOG_URL']).toMatchInlineSnapshot(
      '"https://artifacts.dev.testing-farm.io/1"'
    );

    // All data are provided via context and statuses are disabled by default, no need to call GitHub API
    expect(mocks.request).toHaveBeenCalledTimes(0);

    // Test summary
    await assertSummary(`<h1>Testing Farm as a GitHub Action summary</h1>
<table><tr><th>name</th><th>compose</th><th>arch</th><th>status</th><th>started (UTC)</th><th>time</th><th>logs</th></tr><tr><td>Fedora</td><td>${process.env['INPUT_COMPOSE']}</td><td>${process.env['INPUT_ARCH']}</td><td>✅ passed</td><td>24.08.2021 14:15:22</td><td>1h 1min 31s</td><td><a href="https://artifacts.dev.testing-farm.io/1">test</a>  <a href="https://artifacts.dev.testing-farm.io/1/pipeline.log">pipeline</a></td></tr></table>
`);

    expect(mocks.TFError).not.toHaveBeenCalled();
  });

  test('Hardware test', async () => {
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
    vi.stubEnv('INPUT_TMT_HARDWARE', '{"memory": ">= 8 GB"}');

    // mock the pull request number and sha in the context
    vi.stubEnv('INPUT_PR_NUMBER', '1');
    vi.stubEnv('INPUT_COMMIT_SHA', 'd20d0c37d634a5303fa1e02edc9ea281897ba01a');

    // Mock Testing Farm API
    vi.mocked(mocks.unsafeNewRequest).mockImplementation(
      async (_request: unknown) => {
        return Promise.resolve({
          id: '1',
          state: 'new',
          created: '2021-08-24T14:15:22Z',
          updated: '2021-08-24T14:15:22Z',
        });
      }
    );
    vi.mocked(mocks.requestDetails)
      .mockResolvedValueOnce({
        id: '1',
        state: 'new',
        result: null,
        run_time: 1,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'queued',
        result: null,
        run_time: 61,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'pending',
        result: null,
        run_time: 121,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'running',
        result: null,
        run_time: 181,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'complete',
        result: { overall: 'passed', summary: '\\o/' },
        run_time: 3691,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      });

    // Run action
    const octokit = new Octokit({ auth: 'mock-token' });
    const pr = await PullRequest.initialize(new CustomContext(), octokit);

    await action(pr);

    expect(mocks.newRequest).not.toHaveBeenCalled();
    expect(mocks.unsafeNewRequest).toHaveBeenCalledOnce();

    // Check if we have waited for Testing Farm to finish
    expect(mocks.requestDetails).toHaveBeenCalledTimes(5);

    // Test outputs
    expect(process.env['OUTPUT_REQUEST_ID']).toMatchInlineSnapshot('"1"');
    expect(process.env['OUTPUT_REQUEST_URL']).toMatchInlineSnapshot(
      '"https://api.dev.testing-farm.io/requests/1"'
    );
    expect(process.env['OUTPUT_TEST_LOG_URL']).toMatchInlineSnapshot(
      '"https://artifacts.dev.testing-farm.io/1"'
    );

    // All data are provided via context and statuses are disabled by default, no need to call GitHub API
    expect(mocks.request).toHaveBeenCalledTimes(0);

    // Test summary
    await assertSummary(`<h1>Testing Farm as a GitHub Action summary</h1>
<table><tr><th>name</th><th>compose</th><th>arch</th><th>status</th><th>started (UTC)</th><th>time</th><th>logs</th></tr><tr><td>Fedora</td><td>${process.env['INPUT_COMPOSE']}</td><td>${process.env['INPUT_ARCH']}</td><td>✅ passed</td><td>24.08.2021 14:15:22</td><td>1h 1min 31s</td><td><a href="https://artifacts.dev.testing-farm.io/1">test</a>  <a href="https://artifacts.dev.testing-farm.io/1/pipeline.log">pipeline</a></td></tr></table>
`);

    expect(mocks.TFError).not.toHaveBeenCalled();
  });

  test('Pipeline settings test', async () => {
    setDefaultInputs();

    // Mock required Action inputs
    // api_key - A testing farm server api key
    vi.stubEnv('INPUT_API_KEY', 'abcdef-123456');
    // git_url - An url to the GIT repository
    vi.stubEnv(
      'INPUT_GIT_URL',
      'https://github.com/sclorg/testing-farm-as-github-action'
    );
    vi.stubEnv('INPUT_PIPELINE_SETTINGS', '{"type": "tmt-multihost"}');

    // mock the pull request number and sha in the context
    vi.stubEnv('INPUT_PR_NUMBER', '1');
    vi.stubEnv('INPUT_COMMIT_SHA', 'd20d0c37d634a5303fa1e02edc9ea281897ba01a');

    // Mock Testing Farm API
    vi.mocked(mocks.newRequest).mockImplementation(
      async (_request: NewRequest, _strict: boolean) => {
        return Promise.resolve({
          id: '1',
          state: 'new',
          created: '2021-08-24T14:15:22Z',
          updated: '2021-08-24T14:15:22Z',
        });
      }
    );
    vi.mocked(mocks.requestDetails)
      .mockResolvedValueOnce({
        id: '1',
        state: 'new',
        result: null,
        run_time: 1,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'queued',
        result: null,
        run_time: 61,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'pending',
        result: null,
        run_time: 121,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'running',
        result: null,
        run_time: 181,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'complete',
        result: { overall: 'passed', summary: '\\o/' },
        run_time: 3691,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      });

    // Run action
    const octokit = new Octokit({ auth: 'mock-token' });
    const pr = await PullRequest.initialize(new CustomContext(), octokit);

    await action(pr);

    // hardware reguest has not been called
    expect(mocks.unsafeNewRequest).not.toHaveBeenCalled();

    // Check if we have waited for Testing Farm to finish
    expect(mocks.requestDetails).toHaveBeenCalledTimes(5);

    // Test outputs
    expect(process.env['OUTPUT_REQUEST_ID']).toMatchInlineSnapshot('"1"');
    expect(process.env['OUTPUT_REQUEST_URL']).toMatchInlineSnapshot(
      '"https://api.dev.testing-farm.io/requests/1"'
    );
    expect(process.env['OUTPUT_TEST_LOG_URL']).toMatchInlineSnapshot(
      '"https://artifacts.dev.testing-farm.io/1"'
    );

    // All data are provided via context and statuses are disabled by default, no need to call GitHub API
    expect(mocks.request).toHaveBeenCalledTimes(0);

    // Test summary
    await assertSummary(`<h1>Testing Farm as a GitHub Action summary</h1>
<table><tr><th>name</th><th>compose</th><th>arch</th><th>status</th><th>started (UTC)</th><th>time</th><th>logs</th></tr><tr><td>Fedora</td><td>${process.env['INPUT_COMPOSE']}</td><td>${process.env['INPUT_ARCH']}</td><td>✅ passed</td><td>24.08.2021 14:15:22</td><td>1h 1min 31s</td><td><a href="https://artifacts.dev.testing-farm.io/1">test</a>  <a href="https://artifacts.dev.testing-farm.io/1/pipeline.log">pipeline</a></td></tr></table>
`);

    expect(mocks.TFError).not.toHaveBeenCalled();
  });

  test('Pipeline settings test - invalid input', async () => {
    setDefaultInputs();

    // Mock required Action inputs
    // api_key - A testing farm server api key
    vi.stubEnv('INPUT_API_KEY', 'abcdef-123456');
    // git_url - An url to the GIT repository
    vi.stubEnv(
      'INPUT_GIT_URL',
      'https://github.com/sclorg/testing-farm-as-github-action'
    );
    vi.stubEnv('INPUT_PIPELINE_SETTINGS', '{"type": "multihost"}');

    // mock the pull request number and sha in the context
    vi.stubEnv('INPUT_PR_NUMBER', '1');
    vi.stubEnv('INPUT_COMMIT_SHA', 'd20d0c37d634a5303fa1e02edc9ea281897ba01a');

    vi.mocked(mocks.requestDetails)
      .mockResolvedValueOnce({
        id: '1',
        state: 'new',
        result: null,
        run_time: 1,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'queued',
        result: null,
        run_time: 61,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'pending',
        result: null,
        run_time: 121,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'running',
        result: null,
        run_time: 181,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'complete',
        result: { overall: 'passed', summary: '\\o/' },
        run_time: 3691,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      });

    // Run action
    const octokit = new Octokit({ auth: 'mock-token' });
    const pr = await PullRequest.initialize(new CustomContext(), octokit);

    try {
      await action(pr);
    } catch (error) {
      expect(error).toMatchInlineSnapshot(`
      [ZodError: [
        {
          "received": "multihost",
          "code": "invalid_enum_value",
          "options": [
            "tmt-multihost"
          ],
          "path": [
            "type"
          ],
          "message": "Invalid enum value. Expected 'tmt-multihost', received 'multihost'"
        }
      ]]
      `);
    }

    expect(mocks.unsafeNewRequest).not.toHaveBeenCalled();
    expect(mocks.newRequest).not.toHaveBeenCalled();
  });

  test('Hardware test - wrong JSON', async () => {
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
    vi.stubEnv('INPUT_TMT_HARDWARE', '{"memory":}');

    // mock the pull request number and sha in the context
    vi.stubEnv('INPUT_PR_NUMBER', '1');
    vi.stubEnv('INPUT_COMMIT_SHA', 'd20d0c37d634a5303fa1e02edc9ea281897ba01a');

    vi.mocked(mocks.requestDetails)
      .mockResolvedValueOnce({
        id: '1',
        state: 'new',
        result: null,
        run_time: 1,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'queued',
        result: null,
        run_time: 61,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'pending',
        result: null,
        run_time: 121,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'running',
        result: null,
        run_time: 181,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'complete',
        result: { overall: 'passed', summary: '\\o/' },
        run_time: 3691,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      });

    // Run action
    const octokit = new Octokit({ auth: 'mock-token' });
    const pr = await PullRequest.initialize(new CustomContext(), octokit);

    try {
      await action(pr);
    } catch (error) {
      expect(error).toMatchInlineSnapshot(`
        [SyntaxError: Unexpected token '}', "{"memory":}" is not valid JSON]
      `);
    }

    expect(mocks.unsafeNewRequest).not.toHaveBeenCalled();
    expect(mocks.newRequest).not.toHaveBeenCalled();
  });

  test('Failed test', async () => {
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
    vi.stubEnv('INPUT_UPDATE_PULL_REQUEST_STATUS', 'true');

    // mock the pull request number and sha in the context
    vi.stubEnv('INPUT_PR_NUMBER', '1');
    vi.stubEnv('INPUT_COMMIT_SHA', 'd20d0c37d634a5303fa1e02edc9ea281897ba01a');

    // Mock Testing Farm API
    vi.mocked(mocks.newRequest).mockImplementation(
      async (_request: NewRequest, _strict: boolean) => {
        return Promise.resolve({
          id: '1',
          state: 'new',
          created: '2021-08-24T14:15:22Z',
          updated: '2021-08-24T14:15:22Z',
        });
      }
    );
    vi.mocked(mocks.requestDetails)
      .mockResolvedValueOnce({
        id: '1',
        state: 'new',
        result: null,
        run_time: 1,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'queued',
        result: null,
        run_time: 61,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'pending',
        result: null,
        run_time: 121,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'running',
        result: null,
        run_time: 181,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'complete',
        result: { overall: 'error', summary: '\\o/' },
        run_time: 3691,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      });

    // Run action
    const octokit = new Octokit({ auth: 'mock-token' });
    const pr = await PullRequest.initialize(new CustomContext(), octokit);

    try {
      await action(pr);
    } catch (error) {
      expect(error).toMatchInlineSnapshot(`
        {
          "message": "Build finished - \\o/",
          "url": "https://artifacts.dev.testing-farm.io/1",
        }
      `);
    }

    expect(mocks.TFError).toHaveBeenCalledOnce();

    // Check if we have waited for Testing Farm to finish
    expect(mocks.requestDetails).toHaveBeenCalledTimes(5);

    // Test outputs
    expect(process.env['OUTPUT_REQUEST_ID']).toMatchInlineSnapshot('"1"');
    expect(process.env['OUTPUT_REQUEST_URL']).toMatchInlineSnapshot(
      '"https://api.dev.testing-farm.io/requests/1"'
    );
    expect(process.env['OUTPUT_TEST_LOG_URL']).toMatchInlineSnapshot(
      '"https://artifacts.dev.testing-farm.io/1"'
    );

    // Two calls for setting the status
    expect(mocks.request).toHaveBeenCalledTimes(2);
    expect(mocks.request).toHaveBeenLastCalledWith(
      'POST /repos/{owner}/{repo}/statuses/{sha}',
      {
        context: 'Testing Farm - Fedora',
        description: 'Build finished - \\o/',
        owner: 'sclorg',
        repo: 'testing-farm-as-github-action',
        sha: 'd20d0c37d634a5303fa1e02edc9ea281897ba01a',
        state: 'failure',
        target_url: 'https://artifacts.dev.testing-farm.io/1',
      }
    );

    // Test summary
    await assertSummary(`<h1>Testing Farm as a GitHub Action summary</h1>
<table><tr><th>name</th><th>compose</th><th>arch</th><th>status</th><th>started (UTC)</th><th>time</th><th>logs</th></tr><tr><td>Fedora</td><td>${process.env['INPUT_COMPOSE']}</td><td>${process.env['INPUT_ARCH']}</td><td>❌ error</td><td>24.08.2021 14:15:22</td><td>1h 1min 31s</td><td><a href="https://artifacts.dev.testing-farm.io/1">test</a>  <a href="https://artifacts.dev.testing-farm.io/1/pipeline.log">pipeline</a></td></tr></table>
`);
  });

  test('Testing Farm infrastructure error', async () => {
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
    vi.stubEnv('INPUT_UPDATE_PULL_REQUEST_STATUS', 'true');

    // mock the pull request number and sha in the context
    vi.stubEnv('INPUT_PR_NUMBER', '1');
    vi.stubEnv('INPUT_COMMIT_SHA', 'd20d0c37d634a5303fa1e02edc9ea281897ba01a');

    // Mock Testing Farm API
    vi.mocked(mocks.newRequest).mockImplementation(
      async (_request: NewRequest, _strict: boolean) => {
        return Promise.resolve({
          id: '1',
          state: 'new',
          created: '2021-08-24T14:15:22Z',
          updated: '2021-08-24T14:15:22Z',
        });
      }
    );
    vi.mocked(mocks.requestDetails)
      .mockResolvedValueOnce({
        id: '1',
        state: 'new',
        result: null,
        run_time: 1,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'queued',
        result: null,
        run_time: 61,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'pending',
        result: null,
        run_time: 121,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'running',
        result: null,
        run_time: 181,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'infra-error',
        result: null,
        run_time: 3691,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      });

    // Run action
    const octokit = new Octokit({ auth: 'mock-token' });
    const pr = await PullRequest.initialize(new CustomContext(), octokit);

    try {
      await action(pr);
    } catch (error) {
      expect(error).toMatchInlineSnapshot(`
        {
          "message": "Build failed - Infra problems",
          "url": "https://artifacts.dev.testing-farm.io/1",
        }
      `);
    }

    expect(mocks.TFError).toHaveBeenCalledOnce();

    // Check if we have waited for Testing Farm to finish
    expect(mocks.requestDetails).toHaveBeenCalledTimes(5);

    // Test outputs
    expect(process.env['OUTPUT_REQUEST_ID']).toMatchInlineSnapshot('"1"');
    expect(process.env['OUTPUT_REQUEST_URL']).toMatchInlineSnapshot(
      '"https://api.dev.testing-farm.io/requests/1"'
    );
    expect(process.env['OUTPUT_TEST_LOG_URL']).toMatchInlineSnapshot(
      '"https://artifacts.dev.testing-farm.io/1"'
    );

    // Two calls for setting the status
    expect(mocks.request).toHaveBeenCalledTimes(2);
    expect(mocks.request).toHaveBeenLastCalledWith(
      'POST /repos/{owner}/{repo}/statuses/{sha}',
      {
        context: 'Testing Farm - Fedora',
        description: 'Build failed - Infra problems',
        owner: 'sclorg',
        repo: 'testing-farm-as-github-action',
        sha: 'd20d0c37d634a5303fa1e02edc9ea281897ba01a',
        state: 'failure',
        target_url: 'https://artifacts.dev.testing-farm.io/1',
      }
    );

    // Test summary
    await assertSummary(`<h1>Testing Farm as a GitHub Action summary</h1>
<table><tr><th>name</th><th>compose</th><th>arch</th><th>status</th><th>started (UTC)</th><th>time</th><th>logs</th></tr><tr><td>Fedora</td><td>${process.env['INPUT_COMPOSE']}</td><td>${process.env['INPUT_ARCH']}</td><td>⛔ infra error</td><td>24.08.2021 14:15:22</td><td>1h 1min 31s</td><td><a href="https://artifacts.dev.testing-farm.io/1">test</a>  <a href="https://artifacts.dev.testing-farm.io/1/pipeline.log">pipeline</a></td></tr></table>
`);
  });

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
    vi.stubEnv('INPUT_UPDATE_PULL_REQUEST_STATUS', 'true');

    // Override default inputs
    // Action is waiting for testing farm to finish or until timeout is reached
    // set timeout to 1 to trigger timeout error after 2 requests
    vi.stubEnv('INPUT_TIMEOUT', '1');

    // mock the pull request number and sha in the context
    vi.stubEnv('INPUT_PR_NUMBER', '1');
    vi.stubEnv('INPUT_COMMIT_SHA', 'd20d0c37d634a5303fa1e02edc9ea281897ba01a');

    // Mock Testing Farm API
    vi.mocked(mocks.newRequest).mockImplementation(
      async (_request: NewRequest, _strict: boolean) => {
        return Promise.resolve({
          id: '1',
          state: 'new',
          created: '2021-08-24T14:15:22Z',
          updated: '2021-08-24T14:15:22Z',
        });
      }
    );
    vi.mocked(mocks.requestDetails)
      .mockResolvedValueOnce({
        id: '1',
        state: 'new',
        result: null,
        run_time: 1,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'queued',
        result: null,
        run_time: 61,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'pending',
        result: null,
        run_time: 121,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'running',
        result: null,
        run_time: 181,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'complete',
        result: { overall: 'passed', summary: '\\o/' },
        run_time: 3691,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      });

    // Run action
    const octokit = new Octokit({ auth: 'mock-token' });
    const pr = await PullRequest.initialize(new CustomContext(), octokit);

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

    expect(mocks.TFError).toHaveBeenCalledOnce();

    // Check if we have waited for Testing Farm to finish
    expect(mocks.requestDetails).toHaveBeenCalledTimes(2);

    // Call for setting the status to pending
    expect(mocks.request).toHaveBeenCalledTimes(1);

    // Test summary
    // When timeout is reached, the summary is currently empty
    await assertSummary(``);
  });

  test('Testing Farm private scope', async () => {
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
    vi.stubEnv('INPUT_UPDATE_PULL_REQUEST_STATUS', 'true');

    // Override default inputs
    // tf_scope - Defines the scope of Testing Farm. Possible options are public and private
    vi.stubEnv('INPUT_TF_SCOPE', 'private');

    // mock the pull request number and sha in the context
    vi.stubEnv('INPUT_PR_NUMBER', '1');
    vi.stubEnv('INPUT_COMMIT_SHA', 'd20d0c37d634a5303fa1e02edc9ea281897ba01a');

    // Mock Testing Farm API
    vi.mocked(mocks.newRequest).mockImplementation(
      async (_request: NewRequest, _strict: boolean) => {
        return Promise.resolve({
          id: '1',
          state: 'new',
          created: '2021-08-24T14:15:22Z',
          updated: '2021-08-24T14:15:22Z',
        });
      }
    );
    vi.mocked(mocks.requestDetails)
      .mockResolvedValueOnce({
        id: '1',
        state: 'new',
        result: null,
        run_time: 1,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'queued',
        result: null,
        run_time: 61,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'pending',
        result: null,
        run_time: 121,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'running',
        result: null,
        run_time: 181,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'complete',
        result: { overall: 'passed', summary: '\\o/' },
        run_time: 3691,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      });

    // Run action
    const octokit = new Octokit({ auth: 'mock-token' });
    const pr = await PullRequest.initialize(new CustomContext(), octokit);

    await action(pr);

    // Check if we have waited for Testing Farm to finish
    expect(mocks.requestDetails).toHaveBeenCalledTimes(5);

    // Test outputs
    expect(process.env['OUTPUT_REQUEST_ID']).toMatchInlineSnapshot('"1"');
    expect(process.env['OUTPUT_REQUEST_URL']).toMatchInlineSnapshot(
      '"https://api.dev.testing-farm.io/requests/1"'
    );
    expect(process.env['OUTPUT_TEST_LOG_URL']).toMatchInlineSnapshot(
      '"https://artifacts.dev.testing-farm.io/1"'
    );

    // Two calls for setting the status
    expect(mocks.request).toHaveBeenCalledTimes(2);
    expect(mocks.request).toHaveBeenLastCalledWith(
      'POST /repos/{owner}/{repo}/statuses/{sha}',
      {
        context: 'Testing Farm - Fedora',
        description: 'Build finished - \\o/',
        owner: 'sclorg',
        repo: 'testing-farm-as-github-action',
        sha: 'd20d0c37d634a5303fa1e02edc9ea281897ba01a',
        state: 'success',
        target_url: 'https://artifacts.osci.redhat.com/testing-farm/1',
      }
    );

    // Test summary
    await assertSummary(`<h1>Testing Farm as a GitHub Action summary</h1>
<table><tr><th>name</th><th>compose</th><th>arch</th><th>status</th><th>started (UTC)</th><th>time</th><th>logs</th></tr><tr><td>Fedora</td><td>${process.env['INPUT_COMPOSE']}</td><td>${process.env['INPUT_ARCH']}</td><td>✅ passed</td><td>24.08.2021 14:15:22</td><td>1h 1min 31s</td><td><a href="https://artifacts.osci.redhat.com/testing-farm/1">test</a>  <a href="https://artifacts.osci.redhat.com/testing-farm/1/pipeline.log">pipeline</a></td></tr></table>
`);

    expect(mocks.TFError).not.toHaveBeenCalled();
  });

  test('Pull Request comment with results', async () => {
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
    vi.stubEnv('INPUT_UPDATE_PULL_REQUEST_STATUS', 'true');
    vi.stubEnv('INPUT_TMT_PLAN_FILTER', 'tier:foobar');

    // Override default inputs
    // create_issue_comment - It creates a github issue Comment
    vi.stubEnv('INPUT_CREATE_ISSUE_COMMENT', 'true');

    // mock the pull request number and sha in the context
    vi.stubEnv('INPUT_PR_NUMBER', '1');
    vi.stubEnv('INPUT_COMMIT_SHA', 'd20d0c37d634a5303fa1e02edc9ea281897ba01a');

    // Mock Testing Farm API
    vi.mocked(mocks.newRequest).mockImplementation(
      async (_request: NewRequest, _strict: boolean) => {
        return Promise.resolve({
          id: '1',
          state: 'new',
          created: '2021-08-24T14:15:22Z',
          updated: '2021-08-24T14:15:22Z',
        });
      }
    );
    vi.mocked(mocks.requestDetails)
      .mockResolvedValueOnce({
        id: '1',
        state: 'new',
        result: null,
        run_time: 1,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'queued',
        result: null,
        run_time: 61,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'pending',
        result: null,
        run_time: 121,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'running',
        result: null,
        run_time: 181,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'complete',
        result: { overall: 'passed', summary: '\\o/' },
        run_time: 3691,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      });

    // Run action
    const octokit = new Octokit({ auth: 'mock-token' });
    const pr = await PullRequest.initialize(new CustomContext(), octokit);

    await action(pr);

    // Check if we have waited for Testing Farm to finish
    expect(mocks.requestDetails).toHaveBeenCalledTimes(5);

    // Test outputs
    expect(process.env['OUTPUT_REQUEST_ID']).toMatchInlineSnapshot('"1"');
    expect(process.env['OUTPUT_REQUEST_URL']).toMatchInlineSnapshot(
      '"https://api.dev.testing-farm.io/requests/1"'
    );
    expect(process.env['OUTPUT_TEST_LOG_URL']).toMatchInlineSnapshot(
      '"https://artifacts.dev.testing-farm.io/1"'
    );

    // Two calls for setting the status, the last call is for issue comment
    expect(mocks.request).toHaveBeenCalledTimes(3);
    expect(mocks.request).toHaveBeenCalledWith(
      'POST /repos/{owner}/{repo}/issues/{issue_number}/comments',
      {
        body: `### Testing Farm results
<table><tr><th>name</th><th>compose</th><th>arch</th><th>status</th><th>started (UTC)</th><th>time</th><th>logs</th></tr><tr><td>Fedora</td><td>Fedora-latest</td><td>x86_64</td><td>✅ passed</td><td>24.08.2021 14:15:22</td><td>1h 1min 31s</td><td><a href=\"https://artifacts.dev.testing-farm.io/1\">test</a>  <a href=\"https://artifacts.dev.testing-farm.io/1/pipeline.log\">pipeline</a></td></tr></table>
`,
        issue_number: 1,
        owner: 'sclorg',
        repo: 'testing-farm-as-github-action',
      }
    );

    // Test summary
    await assertSummary(`<h1>Testing Farm as a GitHub Action summary</h1>
<table><tr><th>name</th><th>compose</th><th>arch</th><th>status</th><th>started (UTC)</th><th>time</th><th>logs</th></tr><tr><td>Fedora</td><td>${process.env['INPUT_COMPOSE']}</td><td>${process.env['INPUT_ARCH']}</td><td>✅ passed</td><td>24.08.2021 14:15:22</td><td>1h 1min 31s</td><td><a href="https://artifacts.dev.testing-farm.io/1">test</a>  <a href="https://artifacts.dev.testing-farm.io/1/pipeline.log">pipeline</a></td></tr></table>
`);

    expect(mocks.TFError).not.toHaveBeenCalled();
  });

  test('Running in non pull_request like context', async () => {
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
    vi.stubEnv('INPUT_UPDATE_PULL_REQUEST_STATUS', 'true');

    // Override default inputs
    // create_issue_comment - It creates a github issue Comment
    vi.stubEnv('INPUT_CREATE_ISSUE_COMMENT', 'true');

    // mock the pull request number and sha in the context
    vi.stubEnv('INPUT_PR_NUMBER', '1');
    vi.stubEnv('INPUT_COMMIT_SHA', 'd20d0c37d634a5303fa1e02edc9ea281897ba01a');

    // Mock Testing Farm API
    vi.mocked(mocks.newRequest).mockImplementation(
      async (_request: NewRequest, _strict: boolean) => {
        return Promise.resolve({
          id: '1',
          state: 'new',
          created: '2021-08-24T14:15:22Z',
          updated: '2021-08-24T14:15:22Z',
        });
      }
    );
    vi.mocked(mocks.requestDetails)
      .mockResolvedValueOnce({
        id: '1',
        state: 'new',
        result: null,
        run_time: 1,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'queued',
        result: null,
        run_time: 61,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'pending',
        result: null,
        run_time: 121,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'running',
        result: null,
        run_time: 181,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      })
      .mockResolvedValueOnce({
        id: '1',
        state: 'complete',
        result: { overall: 'passed', summary: '\\o/' },
        run_time: 3691,
        created: '2021-08-24T14:15:22Z',
        updated: '2021-08-24T14:15:22Z',
      });

    // Run action
    const octokit = new Octokit({ auth: 'mock-token' });
    const pr = new PullRequest(
      undefined,
      undefined,
      new CustomContext(),
      octokit,
      {
        commentID: 1,
        data: [],
        context: new CustomContext(),
      } as unknown as Metadata
    );

    await action(pr);

    // Check if we have waited for Testing Farm to finish
    expect(mocks.requestDetails).toHaveBeenCalledTimes(5);

    // Test outputs
    expect(process.env['OUTPUT_REQUEST_ID']).toMatchInlineSnapshot(`"1"`);
    expect(process.env['OUTPUT_REQUEST_URL']).toMatchInlineSnapshot(
      `"https://api.dev.testing-farm.io/requests/1"`
    );
    expect(process.env['OUTPUT_TEST_LOG_URL']).toMatchInlineSnapshot(
      `"https://artifacts.dev.testing-farm.io/1"`
    );

    // Since action doesn't have access to Pull Request context it won't set the status nor create a comment
    expect(mocks.request).toHaveBeenCalledTimes(0);

    // Test summary
    await assertSummary(`<h1>Testing Farm as a GitHub Action summary</h1>
<table><tr><th>name</th><th>compose</th><th>arch</th><th>status</th><th>started (UTC)</th><th>time</th><th>logs</th></tr><tr><td>Fedora</td><td>${process.env['INPUT_COMPOSE']}</td><td>${process.env['INPUT_ARCH']}</td><td>✅ passed</td><td>24.08.2021 14:15:22</td><td>1h 1min 31s</td><td><a href="https://artifacts.dev.testing-farm.io/1">test</a>  <a href="https://artifacts.dev.testing-farm.io/1/pipeline.log">pipeline</a></td></tr></table>
`);

    expect(mocks.TFError).not.toHaveBeenCalled();
  });
});
