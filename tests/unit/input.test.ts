// This file contains unit tests for input parsing.
import { describe, expect, test } from 'vitest';

import {
  tmtArtifactsInputSchema,
  tmtContextInputSchema,
  tmtContextSchema,
  tmtEnvSecretsSchema,
  tmtEnvVarsSchema,
} from '../../src/schema/input';

// They all uses keyValueArrayToObjectSchema, let's test them together
describe('tmt variables/secrets/context input', () => {
  test('default input', () => {
    const input = '';

    expect(tmtEnvVarsSchema.parse(input)).toMatchInlineSnapshot('{}');
    expect(tmtEnvSecretsSchema.parse(input)).toMatchInlineSnapshot('{}');
    expect(tmtContextInputSchema.parse(input)).toMatchInlineSnapshot('{}');
  });

  test('single input key', () => {
    const input = 'FOO=some-value';

    expect(tmtEnvVarsSchema.parse(input)).toMatchInlineSnapshot(`
      {
        "FOO": "some-value",
      }
    `);
    expect(tmtEnvSecretsSchema.parse(input)).toMatchInlineSnapshot(`
      {
        "FOO": "some-value",
      }
    `);
    expect(tmtContextInputSchema.parse(input)).toMatchInlineSnapshot(`
      {
        "FOO": "some-value",
      }
    `);
  });

  test('tmt-context input', () => {
    let input = 'distro=fedora;arch=x86_64;trigger=push';

    expect(tmtContextSchema.parse(tmtContextInputSchema.parse(input)))
      .toMatchInlineSnapshot(`
      {
        "arch": "x86_64",
        "distro": "fedora",
        "trigger": "push",
      }
    `);

    input = 'arch=x86_64';
    expect(tmtContextSchema.parse(tmtContextInputSchema.parse(input)))
      .toMatchInlineSnapshot(`
      {
        "arch": "x86_64",
      }
    `);

    input = '';
    expect(
      tmtContextSchema.parse(tmtContextInputSchema.parse(input))
    ).toMatchInlineSnapshot('{}');
  });

  test('standard input', () => {
    const input = 'FOO=some-value;BOO=other-value';

    expect(tmtEnvVarsSchema.parse(input)).toMatchInlineSnapshot(`
      {
        "BOO": "other-value",
        "FOO": "some-value",
      }
    `);
    expect(tmtEnvSecretsSchema.parse(input)).toMatchInlineSnapshot(`
      {
        "BOO": "other-value",
        "FOO": "some-value",
      }
    `);
    expect(tmtContextInputSchema.parse(input)).toMatchInlineSnapshot(`
      {
        "BOO": "other-value",
        "FOO": "some-value",
      }
    `);
  });

  test('Corner case input', () => {
    const input = 'A=a;B=;=c;D;E=base64=;=';

    expect(tmtEnvVarsSchema.parse(input)).toMatchInlineSnapshot(`
      {
        "": "",
        "A": "a",
        "B": "",
        "D": "",
        "E": "base64=",
      }
    `);
    expect(tmtEnvSecretsSchema.parse(input)).toMatchInlineSnapshot(`
      {
        "": "",
        "A": "a",
        "B": "",
        "D": "",
        "E": "base64=",
      }
    `);
    expect(tmtContextInputSchema.parse(input)).toMatchInlineSnapshot(`
      {
        "": "",
        "A": "a",
        "B": "",
        "D": "",
        "E": "base64=",
      }
    `);
  });
});

describe('tmt artifacts input', () => {
  test('default input', () => {
    const input = '';

    expect(tmtArtifactsInputSchema.parse(input)).toMatchInlineSnapshot('[]');
  });

  test('standard input', () => {
    const input = 'abcd;1234;';

    expect(tmtArtifactsInputSchema.parse(input)).toMatchInlineSnapshot(`
      [
        {
          "id": "abcd",
          "type": "fedora-copr-build",
        },
        {
          "id": "1234",
          "type": "fedora-copr-build",
        },
      ]
    `);
  });

  test('Corner case input', () => {
    const input = 'A=a;B=;=c;D;=';

    expect(tmtArtifactsInputSchema.parse(input)).toMatchInlineSnapshot(`
      [
        {
          "id": "A=a",
          "type": "fedora-copr-build",
        },
        {
          "id": "B=",
          "type": "fedora-copr-build",
        },
        {
          "id": "=c",
          "type": "fedora-copr-build",
        },
        {
          "id": "D",
          "type": "fedora-copr-build",
        },
        {
          "id": "=",
          "type": "fedora-copr-build",
        },
      ]
    `);
  });
});
