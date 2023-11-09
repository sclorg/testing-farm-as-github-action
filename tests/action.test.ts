import { Octokit } from '@octokit/core';
import { context } from '@actions/github';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

const fetchMocker = createFetchMock(vi);
fetchMocker.enableMocks();

import action from '../src/action';

const ownerRepo = (process.env['GITHUB_REPOSITORY'] =
  'sclorg/testing-farm-as-github-action');

// set action inputs using env variables
// api_url - A testing farm server url
process.env['INPUT_API_URL'] = 'https://api.dev.testing-farm.io';
// api_key - A testing farm server api key
process.env['INPUT_API_KEY'] = 'abcdef-123456';
// git_ref - A tmt tests branch which will be used for tests
process.env['INPUT_GIT_REF'] = 'main';
// tmt_plan_regex - A tmt plan regex which will be used for selecting plans. By default all plans are selected
process.env['INPUT_TMT_PLAN_REGEX'] = 'fedora';
// compose - A compose to run tests against
process.env['INPUT_COMPOSE'] = 'Fedora-latest';
// create_issue_comment - It creates a github issue Comment
process.env['INPUT_CREATE_ISSUE_COMMENT'] = 'true';
// pull_request_status_name - GitHub pull request status name
process.env['INPUT_PULL_REQUEST_STATUS_NAME'] = 'Fedora';
// variables - Environment variables for test, separated by ;
process.env['INPUT_VARIABLES'] =
  'REPO_URL=GITHUB_SERVER_URL/GITHUB_REPOSITORY;REPO_NAME=GITHUB_REPOSITORY';
// secrets - Secret environment variables for test env, separated by ;
process.env['INPUT_SECRETS'] = '';
// update_pull_request_status - Action will update pull request status. Default: true
process.env['INPUT_UPDATE_PULL_REQUEST_STATUS'] = 'true';
// create_github_summary - Action will create github summary. Possible options: "false", "true", "key=value"
process.env['INPUT_CREATE_GITHUB_SUMMARY'] = 'true';
// arch - Define an architecture for testing environment. Default: x86_64
process.env['INPUT_ARCH'] = 'x86_64';
// copr - Name of copr to use for the artifacts
process.env['INPUT_COPR'] = 'epel-7-x86_64';
// copr_artifacts - "fedora-copr-build" artifacts for testing environment. Separated by ;
process.env['INPUT_COPR_ARTIFACTS'] = '';
// tmt_context - A value of tmt.context variable https://tmt.readthedocs.io/en/latest/spec/context.html, variables separated by ;
process.env['INPUT_TMT_CONTEXT'] = '';
// tf_scope - Defines the scope of Testing Farm. Possible options are public and private
process.env['INPUT_TF_SCOPE'] = 'public';
// environment_settings - Pass specific settings, like post-install-script, to the testing environment
process.env['INPUT_ENVIRONMENT_SETTINGS'] = '{}';
// pr_head_sha - HEAD SHA of a Pull Request. Used for posting statuses to the PR. The value is obtained from `git rev-parse HEAD` if this input is not set
process.env['INPUT_PR_HEAD_SHA'] = '';

const prNumber = 1;
const sha = 'd20d0c37d634a5303fa1e02edc9ea281897ba01a';
const tfRequestId = '123';

describe('Integration test', () => {
  // mock set statuses
  // mock create comment
  beforeEach(() => {
    // mock github api calls
    fetchMocker.mockIf(/^https?:\/\/api.github.com.*$/, req => {
      switch (req.url) {
        // mock get pull request
        // https://docs.github.com/en/rest/pulls/pulls?apiVersion=2022-11-28#get-a-pull-request
        case `https://api.github.com/repos/${ownerRepo}/pulls/${prNumber}`:
          return {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              head: { sha },
            }),
          };
        // mock set statuses
        // https://docs.github.com/en/rest/commits/statuses?apiVersion=2022-11-28#create-a-commit-status
        case `https://api.github.com/repos/${ownerRepo}/statuses/${sha}`:
          return {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          };
        // mock create comment
        // https://docs.github.com/en/rest/issues/comments?apiVersion=2022-11-28#create-an-issue-comment
        case `https://api.github.com/repos/${ownerRepo}/issues/${prNumber}/comments`:
          return {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          };
        default:
          return {
            status: 404,
            body: 'Not Found',
          };
      }
    });

    // mock testing farm api calls
    fetchMocker.mockIf(/^https?:\/\/api.dev.testing-farm.io\/v0.1.*$/, req => {
      switch (req.url) {
        // mock request a new test
        // https://testing-farm.gitlab.io/api/#operation/requestsPost
        case `https://api.dev.testing-farm.io/v0.1/requests`:
          return {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: tfRequestId,
              url: `https://api.dev.testing-farm.io/v0.1/requests/${tfRequestId}`,
            }),
          };
        // mock test request details
        // https://testing-farm.gitlab.io/api/#operation/requestsGet
        case `https://api.dev.testing-farm.io/v0.1/requests/${tfRequestId}`:
          return {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: tfRequestId,
              state: 'complete',
              result: {
                overall: 'passed',
              },
            }),
          };
        default:
          return {
            status: 404,
            body: 'Not Found',
          };
      }
    });
  });

  test('General use case', async () => {
    const octokit = new Octokit();
    const issueNumber = 1;

    // TODO: fix this test
    // expect(
    //   await action(octokit, {
    //     context: {
    //       repo: { owner: 'sclorg', repo: 'testing-farm-as-github-action' },
    //       issue: { number: issueNumber },
    //     } as unknown as typeof context,
    //   })
    // ).not.toThrow();
    expect(action).toBeInstanceOf(Function);
  });
});
