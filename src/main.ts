import { getInput, getState, setFailed } from '@actions/core';
import { context } from '@actions/github';

import '@total-typescript/ts-reset';

import action from './action';
import { TFError } from './error';
import { getOctokit } from './octokit';
import { PullRequest } from './pull-request';

let pr: PullRequest | undefined = undefined;

try {
  const octokit = getOctokit(getInput('github_token', { required: true }));

  pr = await PullRequest.initialize(context.issue.number, octokit);

  // Call the action function from action.ts
  // all the code should be inside this try block
  await action(pr);
} catch (error) {
  let message: string;

  if (error instanceof Error) {
    message = error.message;
  } else {
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
