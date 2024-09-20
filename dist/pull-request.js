import { debug, getBooleanInput, getInput, warning } from '@actions/core';
import { Metadata } from './metadata';
/**
 * Class for holding information about a Pull Request and interacting with it via the GitHub API.
 */
export class PullRequest {
    constructor(number, sha, context, octokit, metadata) {
        this.number = number;
        this.sha = sha;
        this.context = context;
        this.octokit = octokit;
        this.metadata = metadata;
    }
    isInitialized() {
        return this.number !== undefined && this.sha !== undefined;
    }
    /**
     * Set the Pull Request status using the GitHub API.
     * @param state - The state of the status, can be one of error, failure, pending or success
     * @param description - The description of the status
     * @param url - The URL to link to from the status
     */
    async setStatus(state, description, url) {
        const usePullRequestStatuses = getBooleanInput('update_pull_request_status');
        // Don't set the statuses when they are disabled
        if (!usePullRequestStatuses) {
            debug('Skipping setting Pull Request Status');
            return;
        }
        if (!this.isInitialized()) {
            debug('Skipping setting Pull Request Status, Pull Request is not initialized');
            return;
        }
        const { data } = await this.octokit.request('POST /repos/{owner}/{repo}/statuses/{sha}', Object.assign(Object.assign({}, this.context.repo), { sha: this.sha, state, context: `Testing Farm - ${getInput('pull_request_status_name')}`, description: description ? description.slice(0, 140) : description, target_url: url }));
        debug(`Setting Pull Request Status response: ${JSON.stringify(data, null, 2)}`);
    }
    // TODO: update content to match DATA schema
    async publishComment(content, rawData) {
        if (this.metadata.commentID) {
            // Check if the comment is already up to date
            const currentComment = await this.getComment();
            if (JSON.stringify(currentComment) === JSON.stringify(content))
                return;
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
    async getComment() {
        var _a;
        if (!this.metadata.commentID)
            return '';
        const comment = (_a = (await this.octokit.request('GET /repos/{owner}/{repo}/issues/comments/{comment_id}', Object.assign(Object.assign({}, this.context.repo), { comment_id: +this.metadata.commentID }))).data.body) !== null && _a !== void 0 ? _a : '';
        return comment;
    }
    /**
     * Comment on the Pull Request using the GitHub API.
     * @param body - The body of the comment
     */
    async createComment(body) {
        if (!this.isInitialized()) {
            debug('Skipping adding Issue comment, Pull Request is not initialized');
            return;
        }
        if (!body || body === '')
            return;
        const { data } = await this.octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', Object.assign(Object.assign({}, this.context.repo), { issue_number: this.number, body }));
        debug(`Adding Issue comment response: ${JSON.stringify(data, null, 2)}`);
        return data.id.toString();
    }
    async updateComment(body) {
        if (!this.metadata.commentID)
            return;
        await this.octokit.request('PATCH /repos/{owner}/{repo}/issues/comments/{comment_id}', Object.assign(Object.assign({}, this.context.repo), { comment_id: +this.metadata.commentID, body }));
    }
    /**
     * Initialize a PullRequest instance using data fetched from GitHub API.
     * @param number - The Pull Request number
     * @param octokit - The Octokit instance to use for interacting with the GitHub API
     * @returns A Promise that resolves to a PullRequest instance
     */
    static async initialize(context, octokit) {
        if (context.isShaAvailable()) {
            // If the SHA was provided, use it to initialize the PullRequest
            return new this(context.issue.number, context.sha, context, octokit, await Metadata.getMetadata(context.issue.number, context));
        }
        const { data } = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', Object.assign(Object.assign({}, context.repo), { pull_number: context.issue.number }));
        return new this(data.number, data.head.sha, context, octokit, await Metadata.getMetadata(data.number, context));
    }
}
//# sourceMappingURL=pull-request.js.map