import { debug, getInput } from '@actions/core';
import { context } from '@actions/github';
export class PullRequest {
    constructor(number, sha, octokit) {
        this.number = number;
        this.sha = sha;
        this.octokit = octokit;
    }
    async setStatus(state, description, url) {
        const { data } = await this.octokit.request('POST /repos/{owner}/{repo}/statuses/{sha}', Object.assign(Object.assign({}, context.repo), { sha: this.sha, state, context: `Testing Farm - ${getInput('pull_request_status_name')}`, description, target_url: url }));
        debug(`Setting Pull Request Status response: ${JSON.stringify(data, null, 2)}`);
    }
    async addComment(body, octokit) {
        const { data } = await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', Object.assign(Object.assign({}, context.repo), { issue_number: this.number, body }));
        debug(`Adding Issue comment response: ${JSON.stringify(data, null, 2)}`);
    }
    static async initialize(number, octokit) {
        const { data } = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', Object.assign(Object.assign({}, context.repo), { pull_number: number }));
        return new this(data.number, data.head.sha, octokit);
    }
}
//# sourceMappingURL=pull-request.js.map