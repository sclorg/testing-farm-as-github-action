import { debug, getBooleanInput, getInput } from '@actions/core';
import { context } from '@actions/github';
import { Endpoints } from '@octokit/types';

import { CustomOctokit } from './octokit';

/**
 * Class for holding information about a Pull Request and interacting with it via the GitHub API.
 */
export class PullRequest {
  /**
   * PullRequest constructor, it's not meant to be called directly, use the static initialize method instead.
   * @param number - The Pull Request number
   * @param sha - The head sha of the Pull Request
   * @param octokit - The Octokit instance to use for interacting with the GitHub API
   */
  private constructor(
    readonly number: number,
    readonly sha: string,
    readonly octokit: CustomOctokit
  ) {}

  /**
   * Set the Pull Request status using the GitHub API.
   * @param state - The state of the status, can be one of error, failure, pending or success
   * @param description - The description of the status
   * @param url - The URL to link to from the status
   */
  async setStatus(
    state: Endpoints['POST /repos/{owner}/{repo}/statuses/{sha}']['parameters']['state'],
    description: string,
    url?: string
  ) {
    const usePullRequestStatuses = getBooleanInput(
      'update_pull_request_status'
    );

    // Don't set the statuses when they are disabled
    if (!usePullRequestStatuses) {
      debug('Skipping setting Pull Request Status');
      return;
    }

    const { data } = await this.octokit.request(
      'POST /repos/{owner}/{repo}/statuses/{sha}',
      {
        ...context.repo,
        sha: this.sha,
        state,
        context: `Testing Farm - ${getInput('pull_request_status_name')}`,
        description,
        target_url: url,
      }
    );

    debug(
      `Setting Pull Request Status response: ${JSON.stringify(data, null, 2)}`
    );
  }

  /**
   * Comment on the Pull Request using the GitHub API.
   * @param body - The body of the comment
   */
  async addComment(body: string) {
    const { data } = await this.octokit.request(
      'POST /repos/{owner}/{repo}/issues/{issue_number}/comments',
      {
        ...context.repo,
        issue_number: this.number,
        body,
      }
    );

    debug(`Adding Issue comment response: ${JSON.stringify(data, null, 2)}`);
  }

  /**
   * Initialize a PullRequest instance using data fetched from GitHub API.
   * @param number - The Pull Request number
   * @param octokit - The Octokit instance to use for interacting with the GitHub API
   * @returns A Promise that resolves to a PullRequest instance
   */
  static async initialize(
    number: number,
    octokit: CustomOctokit
  ): Promise<PullRequest> {
    const { data } = await octokit.request(
      'GET /repos/{owner}/{repo}/pulls/{pull_number}',
      {
        ...context.repo,
        pull_number: number,
      }
    );

    return new this(data.number, data.head.sha, octokit);
  }
}
