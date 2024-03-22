import { getInput, setFailed } from '@actions/core';
import { context } from '@actions/github';
import '@total-typescript/ts-reset';
import action from './action';
import { TFError } from './error';
import { getOctokit } from './octokit';
import post from './post';
import { PullRequest } from './pull-request';
import { isPost } from './state';
import { prNumberSchema } from './schema/input';
let pr = undefined;
// All the code should be inside this try block
try {
    const octokit = getOctokit(getInput('github_token', { required: true }));
    const parsedPrNumber = prNumberSchema.safeParse(getInput('pr_number'));
    const prNumber = parsedPrNumber.success
        ? parsedPrNumber.data
        : context.issue.number;
    pr = await PullRequest.initialize(prNumber, octokit);
    // Check if the script was invoked in the post step
    if (!isPost) {
        // Call the action function from action.ts
        await action(pr);
    }
    else {
        await post(pr);
    }
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
        const url = error instanceof TFError ? error.url : undefined;
        await pr.setStatus('error', `${message}`, url);
    }
    // Log the error and set the action status to failed
    setFailed(message);
}
//# sourceMappingURL=main.js.map