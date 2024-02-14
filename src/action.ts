import {
  debug,
  getBooleanInput,
  getInput,
  notice,
  setOutput,
  summary,
} from '@actions/core';
import { Endpoints } from '@octokit/types';
import TestingFarmAPI from 'testing-farm';
import { setTimeout } from 'timers/promises';

import { TFError } from './error';
import { PullRequest } from './pull-request';
import { composeStatusDescription, getSummary } from './util';

import {
  envSettingsSchema,
  tfScopeSchema,
  timeoutSchema,
  tmtArtifactsInputSchema,
  tmtArtifactsSchema,
  tmtContextInputSchema,
  tmtContextSchema,
  tmtEnvSecretsSchema,
  tmtEnvVarsSchema,
  tmtPlanRegexSchema,
} from './schema/input';
import {
  RequestDetails,
  requestDetailsSchema,
  requestSchema,
} from './schema/testing-farm-api';

async function action(pr: PullRequest): Promise<void> {
  const tfInstance = getInput('api_url');

  const api = new TestingFarmAPI(tfInstance);

  // Get commit SHA value
  const sha = pr.sha;
  debug(`SHA: '${sha}'`);

  // Set artifacts url
  const tfScopeParsed = tfScopeSchema.safeParse(getInput('tf_scope'));
  const tfScope = tfScopeParsed.success ? tfScopeParsed.data : 'public';

  const tfArtifactUrl =
    tfScope === 'public'
      ? 'https://artifacts.dev.testing-farm.io'
      : 'http://artifacts.osci.redhat.com/testing-farm';

  // Generate tmt variables
  const tmtEnvVarsParsed = tmtEnvVarsSchema.safeParse(getInput('variables'));
  const tmtEnvVars = tmtEnvVarsParsed.success ? tmtEnvVarsParsed.data : {};

  // Generate tmt secrets
  const tmtEnvSecretsParsed = tmtEnvSecretsSchema.safeParse(
    getInput('secrets')
  );
  const tmtEnvSecrets = tmtEnvSecretsParsed.success
    ? tmtEnvSecretsParsed.data
    : {};

  // Generate tmt artifacts
  const tmtArtifactsParsed = tmtArtifactsInputSchema.safeParse(
    getInput('copr_artifacts')
  );
  const tmtArtifacts = tmtArtifactsParsed.success
    ? tmtArtifactsSchema.parse(tmtArtifactsParsed.data)
    : [];

  // Generate tmt context
  const tmtContextParsed = tmtContextInputSchema.safeParse(
    getInput('tmt_context')
  );
  const tmtContext = tmtContextParsed.success
    ? tmtContextSchema.parse(tmtContextParsed.data)
    : undefined;

  // Conditionally include the name attribute only if tmt_plan_regex is not null
  const tmtPlanRegexParsed = tmtPlanRegexSchema.safeParse(
    getInput('tmt_plan_regex')
  );
  const tmtPlanRegex = tmtPlanRegexParsed.success
    ? { name: tmtPlanRegexParsed.data }
    : {};

  // Generate environment settings
  const envSettingsParsed = envSettingsSchema.safeParse(
    JSON.parse(getInput('environment_settings'))
  );
  const envSettings = envSettingsParsed.success ? envSettingsParsed.data : {};

  // Schedule a test on Testing Farm
  const request = {
    api_key: getInput('api_key', { required: true }),
    test: {
      fmf: {
        url: getInput('git_url', { required: true }),
        ref: getInput('git_ref'),
        ...tmtPlanRegex,
      },
    },
    environments: [
      {
        arch: getInput('arch'),
        os: {
          compose: getInput('compose'),
        },
        variables: tmtEnvVars,
        settings: envSettings,
        secrets: tmtEnvSecrets,
        artifacts: tmtArtifacts,
        tmt: {
          ...(tmtContext ? { context: tmtContext } : {}),
        },
      },
    ],
  };

  // The strict mode should be enabled once https://github.com/redhat-plumbers-in-action/testing-farm/issues/71 is fixed
  const tfResponseRaw = await api.newRequest(request, false);

  // Remove all secrets from request before printing it
  delete (request as Partial<typeof request>).api_key;
  request.environments.map(
    (env: Partial<(typeof request.environments)[number]>) => delete env.secrets
  );
  debug(
    `Testing Farm request (except api_key and environment[].secrets): ${JSON.stringify(
      request,
      null,
      2
    )}`
  );
  debug(`Testing Farm response: ${JSON.stringify(tfResponseRaw, null, 2)}`);

  const tfResponse = requestSchema.parse(tfResponseRaw);

  // Create Pull Request status in state pending
  const usePullRequestStatuses = getBooleanInput('update_pull_request_status');
  if (usePullRequestStatuses) {
    await pr.setStatus(
      'pending',
      'Build started',
      `${tfArtifactUrl}/${tfResponse.id}`
    );
  }

  // Interval of 30 seconds in milliseconds
  const interval = 30 * 1000;
  const parsedTimeout = timeoutSchema.safeParse(getInput('timeout'));
  // set timeout to 960 * 30 seconds ~ 8 hours ; timeout from input is in minutes (hence * 2)
  let timeout = parsedTimeout.success ? parsedTimeout.data * 2 : 960;
  let tfResult: RequestDetails;

  // Check if scheduled test is still running
  // Ask Testing Farm every 30 seconds
  debug(`Testing Farm - waiting for results (timeout: ${timeout} minutes)`);
  do {
    tfResult = requestDetailsSchema.parse(
      await api.requestDetails(tfResponse.id, false)
    );

    if (
      tfResult.state !== 'running' &&
      tfResult.state !== 'new' &&
      tfResult.state !== 'pending' &&
      tfResult.state !== 'queued'
    ) {
      break;
    }

    debug(`Testing Farm - state: '${tfResult.state}'`);
    timeout--;

    await setTimeout(interval);
  } while (timeout > 0);

  if (timeout === 0) {
    throw new TFError(
      `Testing Farm - timeout reached. The test is still in state: '${tfResult.state}'`,
      `${tfArtifactUrl}/${tfResponse.id}`
    );
  }

  debug(`response:'${JSON.stringify(tfResult, null, 2)}'`);

  // Get final state of Testing Farm scheduled request
  const state = tfResult.state;
  const result = tfResult.result ? tfResult.result.overall : 'unknown';
  let finalState: Endpoints['POST /repos/{owner}/{repo}/statuses/{sha}']['parameters']['state'] =
    'success' as const;
  let infraError = false;
  let log = '';

  notice(`State is ${state} and result is: ${result}`);
  if (state === 'complete') {
    if (result !== 'passed') {
      finalState = 'failure' as const;
    }
  } else {
    // Mark job in case of infrastructure issues. Report to Testing Farm team
    infraError = true;
    finalState = 'failure' as const;
    log = 'pipeline.log';
  }

  notice(`Final state is: ${finalState}`);
  notice(`Infra state is: ${infraError ? 'Failed' : 'OK'}`);

  // Set outputs
  setOutput('request_id', tfResponse.id);
  setOutput('request_url', `${tfInstance}/requests/${tfResponse.id}`);

  // Switch Pull Request Status to final state
  if (usePullRequestStatuses) {
    await pr.setStatus(
      finalState,
      composeStatusDescription(infraError, getSummary(tfResult.result)),
      `${tfArtifactUrl}/${tfResponse.id}`
    );
  }

  // Add comment with Testing Farm request/result to Pull Request
  if (getBooleanInput('create_issue_comment')) {
    await pr.addComment(
      `Testing Farm [request](${tfInstance}/requests/${
        tfResponse.id
      }) for ${getInput('compose')}/${getInput(
        'copr_artifacts'
      )} regression testing has been created.` +
        `Once finished, results should be available [here](${tfArtifactUrl}/${tfResponse.id}/).\n` +
        `[Full pipeline log](${tfArtifactUrl}/${tfResponse.id}/pipeline.log).`
    );
  }

  // Create Github Summary
  if (getBooleanInput('create_github_summary')) {
    await summary
      .addHeading('Testing Farm as a GitHub Action summary')
      .addTable([
        [
          { data: 'Compose', header: true },
          { data: 'Arch', header: true },
          { data: 'Infrastructure State', header: true },
          { data: 'Test result', header: true },
          { data: 'Link to logs', header: true },
        ],
        [
          getInput('compose'),
          getInput('arch'),
          infraError ? 'Failed' : 'OK',
          finalState,
          `[pipeline.log](${tfArtifactUrl}/${tfResponse.id}/pipeline.log)`,
        ],
      ])
      .write();
  }

  // Exit with error in case of failure in test
  if (finalState === 'failure') {
    throw new TFError(
      composeStatusDescription(infraError, getSummary(tfResult.result)),
      `${tfArtifactUrl}/${tfResponse.id}`
    );
  }
}

export default action;
