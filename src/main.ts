import { getInput, info, setFailed, warning } from '@actions/core';
import { context } from '@actions/github';

import '@total-typescript/ts-reset';

import action from './action';
import { TFError } from './error';
import { getOctokit } from './octokit';
import post from './post';
import { PullRequest } from './pull-request';
import { isPost } from './state';

let pr: PullRequest | undefined = undefined;

// All the code should be inside this try block
try {
  const octokit = getOctokit(getInput('github_token', { required: true }));

  if (!context.issue || !context.issue.number) {
    warning('Pull request statuses are not available in this context');
    info('No issue number found in the context');

    // Create "empty" PullRequest object
    pr = new PullRequest(undefined, undefined, octokit);
  } else {
    pr = await PullRequest.initialize(context.issue.number, octokit);
  }

  // Check if the script was invoked in the post step
  if (!isPost) {
    // Call the action function from action.ts
    await action(pr);
  } else {
    await post(pr, octokit);
  }
} catch (error) {
  let message: string;

  if (error instanceof Error) {
    message = error.message;
  } else {
    message = JSON.stringify(error);
  }

  // Set the Pull Request status to error when error occurs
  if (pr && pr.isInitialized()) {
    const url = error instanceof TFError ? error.url : undefined;
    await pr.setStatus('error', `${message}`, url);
  }

  // Log the error and set the action status to failed
  setFailed(message);
}
