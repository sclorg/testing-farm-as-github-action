import { getInput, info, setFailed, warning } from '@actions/core';

import '@total-typescript/ts-reset';

import action from './action';
import { CustomContext } from './context';
import { TFError } from './error';
import { Metadata } from './metadata';
import { getOctokit } from './octokit';
import post from './post';
import { PullRequest } from './pull-request';
import { isPost } from './state';

async function run(): Promise<void> {
  let pr: PullRequest | undefined = undefined;

  const customContext = new CustomContext();

  // All the code should be inside this try block
  try {
    const octokit = getOctokit(getInput('github_token', { required: true }));

    if (
      !customContext.isIssueNumberAvailable() ||
      !customContext.isRepoAvailable()
    ) {
      warning('Pull request statuses are not available in this context');
      info('No issue number found in the context');

      // Create "empty" PullRequest object
      pr = new PullRequest(
        undefined,
        undefined,
        customContext,
        octokit,
        //! FIXME:
        // This is very ugly hack, but I haven't had idea how to fix it in a better way. I would need greater refactoring to fix it.
        // It is OK to do it like this, because we don't have access to PR metadata so we wouldn't be trying to access metadata anyway.
        {
          commentID: undefined,
          data: [],
        } as unknown as Metadata
      );
    } else {
      pr = await PullRequest.initialize(customContext, octokit);
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
}

// We have outsourced the main logic into the run function to make it testable
await run();

export default run;
