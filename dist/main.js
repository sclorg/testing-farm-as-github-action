import { getInput, setFailed } from '@actions/core';
import { context } from '@actions/github';
import { Octokit } from '@octokit/core';
import '@total-typescript/ts-reset';
import action from './action';
import { PullRequest } from './pull-request';
try {
    const octokit = new Octokit({
        auth: getInput('github_token', { required: true }),
    });
    const pr = await PullRequest.initialize(context.issue.number, octokit);
    // Call the action function from action.ts
    // all the code should be inside this try block
    await action(pr);
}
catch (error) {
    let message;
    if (error instanceof Error) {
        message = error.message;
    }
    else {
        message = JSON.stringify(error);
    }
    // Log the error and set the action status to failed
    setFailed(message);
}
//# sourceMappingURL=main.js.map