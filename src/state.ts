// Inspired by action/checkout state handling
import { getState, saveState } from '@actions/core';

// Indicates whether the POST action is running
export const isPost = !!getState('isPost');

export function setTfRequestId(requestId: string): void {
  saveState('requestId', requestId);
}

export function getTfRequestId(): string {
  return getState('requestId');
}

export function setTfArtifactUrl(requestUrl: string): void {
  saveState('artifactUrl', requestUrl);
}

export function getTfArtifactUrl(): string {
  return getState('artifactUrl');
}

// Publish a variable so that when the POST action runs, it can determine it should run the cleanup logic.
// This is necessary since we don't have a separate entry point.
// ?NOTE: Post is invoked only when cancelled() is true
if (!isPost) {
  saveState('isPost', 'true');
}
