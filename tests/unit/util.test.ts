import { test, expect, describe, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

import {
  composeStatusDescription,
  getSummary,
  getWhoami,
} from '../../src/util';

describe('Utility functions', () => {
  test('composeStatusDescription', () => {
    let description = '';

    description = composeStatusDescription(false, '');
    expect(description).toMatchInlineSnapshot('"Build finished"');

    description = composeStatusDescription(false, ' - tf summary message');
    expect(description).toMatchInlineSnapshot(
      '"Build finished - tf summary message"'
    );

    description = composeStatusDescription(true, '');
    expect(description).toMatchInlineSnapshot(
      '"Build failed - Infra problems"'
    );

    description = composeStatusDescription(true, ' - tf summary message');
    expect(description).toMatchInlineSnapshot(
      '"Build failed - Infra problems - tf summary message"'
    );
  });

  test('getSummary', () => {
    let summary = '';

    summary = getSummary(null);
    expect(summary).toEqual('');

    summary = getSummary(undefined);
    expect(summary).toEqual('');

    summary = getSummary({ summary: '' });
    expect(summary).toEqual('');

    summary = getSummary({ summary: 'tf summary message' });
    expect(summary).toMatchInlineSnapshot('" - tf summary message"');
  });
});

describe('getWhoami', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('should return whoami data for public ranch', async () => {
    const mockResponse = {
      data: {
        token: {
          created: '2025-01-14T22:50:54.124564',
          enabled: true,
          id: '1fc3a92a-f32f-4f75-bed9-96c8163215f5',
          name: 'token',
          ranch: 'public',
          role: 'user',
          updated: '2025-01-14T22:50:54.124573',
          user_id: 'e42ad3aa-1769-402d-be8b-9fab3d10cc2',
        },
        user: {
          auth_id: 'somebody',
          auth_method: 'fedora',
          auth_name: 'somebody',
          created: '2024-08-08T04:01:20.227364',
          enabled: true,
          id: 'e41ad3ab-1569-402d-bf8b-86fab3d10cc3',
          updated: '2024-08-08T04:01:20.227369',
        },
      },
    };

    vi.spyOn(axios, 'get').mockResolvedValue(mockResponse);

    const result = await getWhoami(
      'https://api.dev.testing-farm.io/v0.1',
      'test-api-key'
    );

    expect(result).not.toBeNull();
    expect(result?.token.ranch).toBe('public');
    expect(axios.get).toHaveBeenCalledWith(
      'https://api.dev.testing-farm.io/v0.1/whoami',
      {
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer test-api-key',
        },
      }
    );
  });

  test('should return whoami data for private ranch', async () => {
    const mockResponse = {
      data: {
        token: {
          created: '2025-01-14T22:50:54.124564',
          enabled: true,
          id: '1fc3a92a-f32f-4f75-bed9-96c8163215f5',
          name: 'token',
          ranch: 'private',
          role: 'user',
          updated: '2025-01-14T22:50:54.124573',
          user_id: 'e42ad3aa-1769-402d-be8b-9fab3d10cc2',
        },
        user: {
          auth_id: 'somebody',
          auth_method: 'fedora',
          auth_name: 'somebody',
          created: '2024-08-08T04:01:20.227364',
          enabled: true,
          id: 'e41ad3ab-1569-402d-bf8b-86fab3d10cc3',
          updated: '2024-08-08T04:01:20.227369',
        },
      },
    };

    vi.spyOn(axios, 'get').mockResolvedValue(mockResponse);

    const result = await getWhoami(
      'https://api.dev.testing-farm.io/v0.1',
      'test-api-key'
    );

    expect(result).not.toBeNull();
    expect(result?.token.ranch).toBe('private');
  });

  test('should return null when whoami endpoint fails', async () => {
    vi.spyOn(axios, 'get').mockRejectedValue(new Error('Network error'));

    const result = await getWhoami(
      'https://api.dev.testing-farm.io/v0.1',
      'test-api-key'
    );

    expect(result).toBeNull();
  });

  test('should return null when response does not match schema', async () => {
    const mockResponse = {
      data: {
        invalid: 'data',
      },
    };

    vi.spyOn(axios, 'get').mockResolvedValue(mockResponse);

    const result = await getWhoami(
      'https://api.dev.testing-farm.io/v0.1',
      'test-api-key'
    );

    expect(result).toBeNull();
  });
});
