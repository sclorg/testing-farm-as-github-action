import { getInput, setFailed } from '@actions/core';
import { context } from '@actions/github';
import { Octokit } from '@octokit/core';
import '@total-typescript/ts-reset';
import action from './action';
import { PullRequest } from './pull-request';
let pr = undefined;
try {
    const octokit = new Octokit({
        auth: getInput('github_token', { required: true }),
    });
    pr = await PullRequest.initialize(context.issue.number, octokit);
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
    // Set the Pull Request status to error when error occurs
    if (pr) {
        await pr.setStatus('error', `Error occurred: ${message.slice(0, 30)}`);
    }
    // Log the error and set the action status to failed
    setFailed(message);
}
//# sourceMappingURL=main.js.map