import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import run from '../src/main';

const mocks = vi.hoisted(() => {
  return {
    action: vi.fn(),
    post: vi.fn(),
    context: vi.fn(),
    request: vi.fn(),
    getState: vi.fn(),
  };
});

// Mock @octokit/core module
vi.mock('@octokit/core', () => {
  const Octokit = vi.fn(() => ({
    request: mocks.request,
  }));

  // mock static method
  // https://stackoverflow.com/a/77275072/10221282
  Octokit['plugin'] = vi.fn();

  return { Octokit };
});

// Mock @actions/core module
vi.mock('@actions/core', async () => {
  const actual = await vi.importActual('@actions/core');
  return {
    ...(actual as any),
    error: vi.fn(),
    getState: mocks.getState,
  };
});

// Mock @actions/github module
vi.mock('@actions/github', () => {
  return {
    context: mocks.context,
  };
});

vi.mock('../src/octokit', () => {
  const getOctokit = vi.fn(() => ({
    request: mocks.request,
  }));

  return { getOctokit };
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
    vi.stubEnv('INPUT_GITHUB_TOKEN', 'mock-token');

    // We don't want to call the actual action function
    vi.mocked(mocks.action).mockResolvedValue(
      'Action function has been called'
    );

    // We don't want to call the actual post function
    vi.mocked(mocks.post).mockResolvedValue('Post function has been called');

    vi.mocked(mocks.context).mockReturnValue(() => {
      return {
        repo: {
          owner: 'sclorg',
          repo: 'testing-farm-as-github-action',
        },
        runId: 123456,
        issue: {
          number: 1,
        },
      };
    });

    // Mock getState
    vi.mocked(mocks.getState).mockImplementation(name => {
      return process.env[`STATE_${name.toUpperCase()}`];
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  test('Regular run', async () => {
    await run();

    expect(mocks.action).toHaveBeenCalled();
    expect(mocks.post).not.toHaveBeenCalled();
  });

  test('Non PR context run', async () => {
    vi.mocked(mocks.context).mockReturnValue(() => {
      return {
        repo: {
          owner: 'sclorg',
          repo: 'testing-farm-as-github-action',
        },
        runId: 123456,
      };
    });

    await run();

    expect(mocks.action).toHaveBeenCalled();
    expect(mocks.post).not.toHaveBeenCalled();
  });

  //! FIXME: This test is failing
  test.skip('Post run', async () => {
    vi.stubEnv('INPUT_GITHUB_TOKEN', 'mock-token');

    // Mock States
    vi.stubEnv('STATE_ISPOST', 'true');

    vi.mocked(mocks.context).mockReturnValue(() => {
      return {
        repo: {
          owner: 'sclorg',
          repo: 'testing-farm-as-github-action',
        },
        runId: 123456,
      };
    });

    await run();

    expect(mocks.post).toHaveBeenCalled();
    expect(mocks.action).not.toHaveBeenCalled();
  });

  test.todo('Error handling', async () => {});
});
