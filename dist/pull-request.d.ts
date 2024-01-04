import { Endpoints } from '@octokit/types';
import { CustomOctokit } from './octokit';
/**
 * Class for holding information about a Pull Request and interacting with it via the GitHub API.
 */
export declare class PullRequest {
    readonly number: number;
    readonly sha: string;
    readonly octokit: CustomOctokit;
    /**
     * PullRequest constructor, it's not meant to be called directly, use the static initialize method instead.
     * @param number - The Pull Request number
     * @param sha - The head sha of the Pull Request
     * @param octokit - The Octokit instance to use for interacting with the GitHub API
     */
    private constructor();
    /**
     * Set the Pull Request status using the GitHub API.
     * @param state - The state of the status, can be one of error, failure, pending or success
     * @param description - The description of the status
     * @param url - The URL to link to from the status
     */
    setStatus(state: Endpoints['POST /repos/{owner}/{repo}/statuses/{sha}']['parameters']['state'], description: string, url?: string): Promise<void>;
    /**
     * Comment on the Pull Request using the GitHub API.
     * @param body - The body of the comment
     */
    addComment(body: string): Promise<void>;
    /**
     * Initialize a PullRequest instance using data fetched from GitHub API.
     * @param number - The Pull Request number
     * @param octokit - The Octokit instance to use for interacting with the GitHub API
     * @returns A Promise that resolves to a PullRequest instance
     */
    static initialize(number: number, octokit: CustomOctokit): Promise<PullRequest>;
}
