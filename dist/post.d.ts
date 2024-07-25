import { CustomOctokit } from './octokit';
import { PullRequest } from './pull-request';
declare function post(pr: PullRequest, octokit: CustomOctokit): Promise<void>;
export default post;
