import { debug, getBooleanInput, getInput, warning } from '@actions/core';
import { Endpoints } from '@octokit/types';

import { CustomOctokit } from './octokit';
import { CustomContext } from './context';
import { Metadata } from './metadata';

import { Data } from './schema/metadata';

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
  constructor(
    number: undefined,
    sha: undefined,
    context: CustomContext,
    octokit: CustomOctokit,
    metadata: Metadata
  );
  constructor(
    number: number,
    sha: string,
    context: CustomContext,
    octokit: CustomOctokit,
    metadata: Metadata
  );
  constructor(
    readonly number: number | undefined,
    readonly sha: string | undefined,
    readonly context: CustomContext,
    readonly octokit: CustomOctokit,
    readonly metadata: Metadata
  ) {}

  isInitialized(): boolean {
    return this.number !== undefined && this.sha !== undefined;
  }

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

    if (!this.isInitialized()) {
      debug(
        'Skipping setting Pull Request Status, Pull Request is not initialized'
      );
      return;
    }

    const { data } = await this.octokit.request(
      'POST /repos/{owner}/{repo}/statuses/{sha}',
      {
        ...this.context.repo,
        sha: this.sha as string,
        state,
        context: `Testing Farm - ${getInput('pull_request_status_name')}`,
        description: description ? description.slice(0, 140) : description,
        target_url: url,
      }
    );

    debug(
      `Setting Pull Request Status response: ${JSON.stringify(data, null, 2)}`
    );
  }

  // TODO: update content to match DATA schema
  async publishComment(content: string, rawData: Data[]) {
    if (this.metadata.commentID) {
      // Check if the comment is already up to date
      const currentComment = await this.getComment();
      if (JSON.stringify(currentComment) === JSON.stringify(content)) return;
      // Update the comment
      this.updateComment(content);
      // Store new metadata
      await this.metadata.setMetadata(rawData);
      return;
    }

    const newCommentID = await this.createComment(content);

    if (!newCommentID) {
      warning(`Failed to create comment.`);
      return;
    }

    this.metadata.commentID = newCommentID;
    // Store metadata
    await this.metadata.setMetadata(rawData);
  }

  async getComment(): Promise<string> {
    if (!this.metadata.commentID) return '';

    const comment =
      (
        await this.octokit.request(
          'GET /repos/{owner}/{repo}/issues/comments/{comment_id}',
          {
            ...this.context.repo,
            comment_id: +this.metadata.commentID,
          }
        )
      ).data.body ?? '';

    return comment;
  }

  /**
   * Comment on the Pull Request using the GitHub API.
   * @param body - The body of the comment
   */
  async createComment(body: string): Promise<string | undefined> {
    if (!this.isInitialized()) {
      debug('Skipping adding Issue comment, Pull Request is not initialized');
      return;
    }

    if (!body || body === '') return;

    const { data } = await this.octokit.request(
      'POST /repos/{owner}/{repo}/issues/{issue_number}/comments',
      {
        ...this.context.repo,
        issue_number: this.number as number,
        body,
      }
    );

    debug(`Adding Issue comment response: ${JSON.stringify(data, null, 2)}`);
    return data.id.toString();
  }

  async updateComment(body: string): Promise<void> {
    if (!this.metadata.commentID) return;

    await this.octokit.request(
      'PATCH /repos/{owner}/{repo}/issues/comments/{comment_id}',
      {
        ...this.context.repo,
        comment_id: +this.metadata.commentID,
        body,
      }
    );
  }

  /**
   * Initialize a PullRequest instance using data fetched from GitHub API.
   * @param number - The Pull Request number
   * @param octokit - The Octokit instance to use for interacting with the GitHub API
   * @returns A Promise that resolves to a PullRequest instance
   */
  static async initialize(
    context: CustomContext,
    octokit: CustomOctokit
  ): Promise<PullRequest> {
    if (context.isShaAvailable()) {
      // If the SHA was provided, use it to initialize the PullRequest
      return new this(
        context.issue.number,
        context.sha as string,
        context,
        octokit,
        await Metadata.getMetadata(context.issue.number, context)
      );
    }

    const { data } = await octokit.request(
      'GET /repos/{owner}/{repo}/pulls/{pull_number}',
      {
        ...context.repo,
        pull_number: context.issue.number,
      }
    );

    return new this(
      data.number,
      data.head.sha,
      context,
      octokit,
      await Metadata.getMetadata(data.number, context)
    );
  }
}
