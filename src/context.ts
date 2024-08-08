import { getInput } from '@actions/core';
import { context } from '@actions/github';

export class CustomContext {
  readonly repo: typeof context.repo;
  readonly issue: Pick<typeof context.issue, 'number'>;
  readonly sha: string | undefined;

  constructor() {
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
        : context.issue?.number,
    };

    this.sha = this.isInputAvailable(commitShaInput)
      ? commitShaInput
      : undefined;
  }

  isRepoAvailable(): boolean {
    return !!this.repo.owner && !!this.repo.repo;
  }

  isIssueNumberAvailable(): boolean {
    return !!this.issue.number;
  }

  isShaAvailable(): boolean {
    return !!this.sha;
  }

  isInputAvailable(input: any): boolean {
    return !!input;
  }
}
