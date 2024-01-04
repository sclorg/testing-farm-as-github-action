import { info, warning } from '@actions/core';
import { Octokit } from '@octokit/core';
import { throttling } from '@octokit/plugin-throttling';

const CustomOctokit = Octokit.plugin(throttling);

export type CustomOctokit = InstanceType<typeof CustomOctokit>;

export function getOctokit(token: string) {
  return new CustomOctokit({
    auth: token,
    throttle: {
      onRateLimit: (retryAfter, options, _octokit, retryCount) => {
        warning(
          `Request quota exhausted for request ${options.method} ${options.url}`
        );

        // Retry once after hitting a rate limit error, then give up
        if (retryCount < 1) {
          info(`Retrying after ${retryAfter} seconds!`);
          return true;
        }
      },
      onSecondaryRateLimit: (_retryAfter, options) => {
        // When a secondary rate limit is hit, don't retry
        warning(
          `SecondaryRateLimit detected for request ${options.method} ${options.url}`
        );
      },
    },
  });
}
