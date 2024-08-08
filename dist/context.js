import { getInput } from '@actions/core';
import { context } from '@actions/github';
export class CustomContext {
    constructor() {
        var _a;
        const repoOwnerInput = getInput('repo_owner');
        const repoNameInput = getInput('repo_name');
        const prNumberInput = getInput('pr_number');
        const commitShaInput = getInput('commit_sha');
        this.repo = {
            owner: this.isInputAvailable(repoOwnerInput)
                ? repoOwnerInput
                : context.repo.owner,
            repo: this.isInputAvailable(repoNameInput)
                ? repoNameInput
                : context.repo.repo,
        };
        this.issue = {
            number: this.isInputAvailable(prNumberInput)
                ? +prNumberInput
                : (_a = context.issue) === null || _a === void 0 ? void 0 : _a.number,
        };
        this.sha = this.isInputAvailable(commitShaInput)
            ? commitShaInput
            : undefined;
    }
    isRepoAvailable() {
        return !!this.repo.owner && !!this.repo.repo;
    }
    isIssueNumberAvailable() {
        return !!this.issue.number;
    }
    isShaAvailable() {
        return !!this.sha;
    }
    isInputAvailable(input) {
        return !!input;
    }
}
//# sourceMappingURL=context.js.map