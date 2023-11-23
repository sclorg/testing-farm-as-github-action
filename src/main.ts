import { getInput, setFailed } from '@actions/core';
import { Octokit } from '@octokit/core';

import '@total-typescript/ts-reset';

import action from './action';

try {
  const octokit = new Octokit({
    auth: getInput('github_token', { required: true }),
  });

  // Call the action function from action.ts
  // all the code should be inside this try block
  await action(octokit);
} catch (error) {
  let message: string;

  if (error instanceof Error) {
    message = error.message;
  } else {
    message = JSON.stringify(error);
  }

  // Log the error and set the action status to failed
  setFailed(message);
}
