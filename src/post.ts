import { debug, getInput, notice } from '@actions/core';
import TestingFarmAPI from 'testing-farm';

import { PullRequest } from './pull-request';
import { getTfArtifactUrl, getTfRequestId } from './state';

async function post(pr: PullRequest): Promise<void> {
  const tfInstance = getInput('api_url');
  const tfRequestId = getTfRequestId();
  const tfArtifactUrl = getTfArtifactUrl();

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

export default post;
