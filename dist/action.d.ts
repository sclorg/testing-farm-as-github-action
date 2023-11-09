import { context } from '@actions/github';
import { Octokit } from '@octokit/core';
declare function action(octokit: Octokit, mock?: {
    context: typeof context;
}): Promise<void>;
export default action;
