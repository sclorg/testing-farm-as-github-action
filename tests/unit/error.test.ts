/**
 * Test TFError class - unit tests
 */
import { describe, expect, test } from 'vitest';

import { TFError } from '../../src/error';

describe('Test TFError class', () => {
  test('without url', () => {
    const error = new TFError('Some error');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(TFError);

    expect(error.message).toMatchInlineSnapshot(`"Some error"`);
    expect(error.url).toBeUndefined();
  });

  test('with url', () => {
    const error = new TFError('Some error', 'https://example.com');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(TFError);

    expect(error.message).toMatchInlineSnapshot(`"Some error"`);
    expect(error.url).toMatchInlineSnapshot(`"https://example.com"`);
  });
});
