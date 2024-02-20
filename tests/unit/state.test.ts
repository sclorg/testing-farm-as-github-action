import { test, expect, describe, vi, afterAll } from 'vitest';

import {
  isPost,
  getTfRequestId,
  setTfRequestId,
  setTfArtifactUrl,
  getTfArtifactUrl,
} from '../../src/state';

// Mock @actions/core module
vi.mock('@actions/core', async () => {
  const actual = await vi.importActual('@actions/core');
  return {
    ...(actual as any),
    saveState: vi.fn().mockImplementation((name, value) => {
      vi.stubEnv(`STATE_${name.toUpperCase()}`, value);
    }),
    getState: vi.fn().mockImplementation(name => {
      return process.env[`STATE_${name.toUpperCase()}`];
    }),
  };
});

describe('State functions', () => {
  afterAll(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  // !FIXME: This test needs some love ❤️
  test.skip('test isPost state', () => {
    expect(isPost).toEqual(true);
  });

  test('TfRequestId state', () => {
    setTfRequestId('123');
    expect(getTfRequestId()).toEqual('123');
  });

  test('TfRequestUrl state', () => {
    setTfArtifactUrl('http://example.com');
    expect(getTfArtifactUrl()).toEqual('http://example.com');
  });
});
