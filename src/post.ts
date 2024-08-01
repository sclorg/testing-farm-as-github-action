import { debug, getInput, notice } from '@actions/core';
import { context } from '@actions/github';
import TestingFarmAPI from 'testing-farm';

import { CustomOctokit } from './octokit';
import { PullRequest } from './pull-request';
import { getTfArtifactUrl, getTfRequestId } from './state';

import { timeoutSchema } from './schema/input';

//! We assume that the job is running on GitHub Public Runner
// GitHub Public Runner has a limit of 6 hours
// https://docs.github.com/en/actions/administering-github-actions/usage-limits-billing-and-administration#usage-limits
const RUNNER_TIMEOUT_SEC = 6 * 60 * 60;

async function post(pr: PullRequest, octokit: CustomOctokit): Promise<void> {
  const tfInstance = getInput('api_url');
  const tfRequestId = getTfRequestId();
  const tfArtifactUrl = getTfArtifactUrl();

  const parsedTimeout = timeoutSchema.safeParse(getInput('timeout'));
  let timeout = parsedTimeout.success ? parsedTimeout.data * 2 : 960;

  // Inspired by GitHub Discussion: https://github.com/orgs/community/discussions/8945
  const jobsData = (
    await octokit.request(
      'GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs',
      {
        // use Custom Context to take into account `repo_owner` and `repo_name` inputs
        ...pr.context.repo,
        run_id: context.runId,
      }
    )
  ).data;

  // Find the running job with a cancelled step
  const tooLongRunningJob = jobsData.jobs.find(job => {
    job.status === 'in_progress' &&
      job.steps?.some(step => step.conclusion === 'cancelled') &&
      getJobRunningTime(job.started_at) >= RUNNER_TIMEOUT_SEC;
  });

  if (tooLongRunningJob) {
    notice(
      `Job ${tooLongRunningJob.name} is running for too long. Workflow run is going to be canceled by GitHub Actions Public Runner. For more information see: https://docs.github.com/en/actions/administering-github-actions/usage-limits-billing-and-administration#usage-limits`
    );

    if (timeout > RUNNER_TIMEOUT_SEC / 60) {
      notice(
        `Testing Farm request won't be cancelled, because the timeout is set to ${timeout} minutes. Results can be accessed at ${tfArtifactUrl}.`
      );

      // Timeout is set to higher value, lets not cancel the Testing Farm request
      return;
    }
  }

  const api = new TestingFarmAPI(tfInstance);

  // This should happen really rarely, but it's better to check
  if (!tfRequestId) {
    throw new Error('POST: Missing Testing Farm request id');
  }

  const request = {
    api_key: getInput('api_key', { required: true }),
  };

  notice(`Cancelling Testing Farm request: ${tfRequestId}`);
  await api.cancelRequest(tfRequestId, request, false);
  debug(`Request ${tfRequestId} was cancelled`);

  // Set status to success when the request was cancelled
  // It's not a test failure, the request was cancelled by the user
  pr.isInitialized() &&
    (await pr.setStatus(
      'success',
      'Testing Farm request was cancelled',
      tfArtifactUrl ?? undefined
    ));
}

/**
 * Function to get the running time of the job in seconds
 * @param startedAt
 * @returns
 */
function getJobRunningTime(startedAt: string): number {
  const started = new Date(startedAt);
  const now = new Date();

  const diff = (now.getTime() - started.getTime()) / 1000;

  notice(`Job is running for ${diff} seconds`);
  return diff;
}

export default post;
