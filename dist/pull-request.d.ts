import { Octokit } from '@octokit/core';
import { Endpoints } from '@octokit/types';
export declare class PullRequest {
    readonly number: number;
    readonly sha: string;
    readonly octokit: Octokit;
    private constructor();
    setStatus(state: Endpoints['POST /repos/{owner}/{repo}/statuses/{sha}']['parameters']['state'], description: string, url: string): Promise<void>;
    addComment(body: string, octokit: Octokit): Promise<void>;
    static initialize(number: number, octokit: Octokit): Promise<PullRequest>;
}
