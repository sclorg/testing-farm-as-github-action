import { Octokit } from '@octokit/core';
declare const CustomOctokit: typeof Octokit & import("@octokit/core/dist-types/types.d").Constructor<{}>;
export type CustomOctokit = InstanceType<typeof CustomOctokit>;
export declare function getOctokit(token: string): Octokit;
export {};
