import { debug, getInput } from '@actions/core';
import { context } from '@actions/github';
import { Octokit } from '@octokit/core';
import { Endpoints } from '@octokit/types';

export class PullRequest {
  private constructor(
    readonly number: number,
    readonly sha: string,
    readonly octokit: Octokit
  ) {}

  async setStatus(
    state: Endpoints['POST /repos/{owner}/{repo}/statuses/{sha}']['parameters']['state'],
    description: string,
    url: string
  ) {
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

  async addComment(body: string, octokit: Octokit) {
    const { data } = await octokit.request(
      'POST /repos/{owner}/{repo}/issues/{issue_number}/comments',
      {
        ...context.repo,
        issue_number: this.number,
        body,
      }
    );

    debug(`Adding Issue comment response: ${JSON.stringify(data, null, 2)}`);
  }

  static async initialize(
    number: number,
    octokit: Octokit
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
