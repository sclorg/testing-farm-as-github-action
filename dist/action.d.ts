import { PullRequest } from './pull-request';
declare function action(pr: PullRequest): Promise<void>;
export default action;
