import { afterEach, describe, expect, test, vi } from 'vitest';

import { CustomContext } from '../../src/context';

// Mock @actions/github module
vi.mock('@actions/github', async () => {
  return {
    context: {
      repo: {
        owner: 'sclorg',
        repo: 'testing-farm-as-github-action',
      },
      issue: {
        number: 1,
      },
    },
  };
});

describe('Custom Context class', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  test('Data gathered from the context', () => {
    const customContext = new CustomContext();

    expect(customContext.repo).toMatchInlineSnapshot(`
      {
        "owner": "sclorg",
        "repo": "testing-farm-as-github-action",
      }
    `);
    expect(customContext.issue.number).toMatchInlineSnapshot(`1`);
  });

  test('Data from inputs', () => {
    vi.stubEnv('INPUT_REPO_OWNER', 'custom-owner');
    vi.stubEnv('INPUT_REPO_NAME', 'custom-repo');
    vi.stubEnv('INPUT_PR_NUMBER', '2');
    vi.stubEnv('INPUT_COMMIT_SHA', 'custom-sha');

    const customContext = new CustomContext();

    expect(customContext.repo).toMatchInlineSnapshot(`
      {
        "owner": "custom-owner",
        "repo": "custom-repo",
      }
    `);
    expect(customContext.issue.number).toMatchInlineSnapshot(`2`);
    expect(customContext.sha).toMatchInlineSnapshot(`"custom-sha"`);
  });
});
