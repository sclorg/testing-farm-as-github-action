import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import run from '../src/main';

vi.stubEnv('INPUT_GITHUB_TOKEN', 'mock-token');

const mocks = vi.hoisted(() => {
  return {
    action: vi.fn(),
    post: vi.fn(),
  };
});

// Mock @actions/github module
vi.mock('@actions/github', () => {
  return {
    context: {
      repo: {
        owner: 'sclorg',
        repo: 'testing-farm-as-github-action',
      },
    },
  };
});

// Mock @actions/core module
vi.mock('@actions/core', async () => {
  const actual = await vi.importActual('@actions/core');
  return {
    ...(actual as any),
    error: vi.fn(),
    getState: vi.fn().mockImplementation(name => {
      return process.env[`STATE_${name.toUpperCase()}`];
    }),
    getInput: vi.fn().mockImplementation((name, options) => {
      return process.env[`INPUT_${name.toUpperCase()}`];
    }),
  };
});

vi.mock('../src/action.ts', async () => {
  return {
    default: mocks.action,
  };
});

vi.mock('../src/post.ts', async () => {
  return {
    default: mocks.post,
  };
});

describe('Integration tests - main.ts', () => {
  beforeEach(async () => {
    // We don't want to call the actual action function
    vi.mocked(mocks.action).mockImplementation(async pr => {
      return `Action function has been called with ${pr}`;
    });

    // We don't want to call the actual post function
    vi.mocked(mocks.post).mockImplementation(async (pr, _octokit) => {
      return `Post function has been called with ${pr}`;
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  test('Regular run', async () => {
    vi.stubEnv('INPUT_GITHUB_TOKEN', 'mock-token');

    // mock the pull request number in the context
    vi.stubEnv('INPUT_PR_NUMBER', '1');
    await run();

    expect(mocks.action).toHaveBeenCalled();

    expect(mocks.post).not.toHaveBeenCalled();
  });

  //! FIXME: This test is failing because the `getState` function is not mocked correctly
  test.skip('Post run', async () => {
    vi.stubEnv('INPUT_GITHUB_TOKEN', 'mock-token');

    // Mock States
    vi.stubEnv('STATE_ISPOST', 'true');

    await run();

    expect(mocks.post).toHaveBeenCalled();

    expect(mocks.action).not.toHaveBeenCalled();
  });

  test.todo('Error handling', async () => {});
});
