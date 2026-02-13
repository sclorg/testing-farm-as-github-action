import {
  debug,
  getBooleanInput,
  getInput,
  notice,
  setOutput,
} from '@actions/core';
import { Endpoints } from '@octokit/types';
import TestingFarmAPI from 'testing-farm';
import { setTimeout } from 'timers/promises';

import { TFError } from './error';
import { PullRequest } from './pull-request';
import { setTfArtifactUrl, setTfRequestId } from './state';
import { Summary } from './summary';
import { composeStatusDescription, getSummary } from './util';

import {
  pipelineSettingsSchema,
  envSettingsSchema,
  timeoutSchema,
  tmtArtifactsInputSchema,
  tmtArtifactsSchema,
  tmtContextInputSchema,
  tmtContextSchema,
  tmtEnvSecretsSchema,
  tmtEnvVarsSchema,
  tmtPlanRegexSchema,
  tmtPlanFilterSchema,
  tmtPathSchema,
} from './schema/input';
import {
  RequestDetails,
  requestDetailsSchema,
  requestSchema,
} from './schema/testing-farm-api';

async function action(pr: PullRequest): Promise<void> {
  const tfInstance = getInput('api_url');

  // https://github.com/redhat-plumbers-in-action/testing-farm?tab=readme-ov-file#creating-the-api-instance
  const api = new TestingFarmAPI(
    tfInstance,
    getInput('api_key', { required: true })
  );

  // Set artifacts url
  const tfScope = (await api.whoami()).token.ranch;
  const tfUrl =
    tfScope === 'public'
      ? 'https://artifacts.dev.testing-farm.io'
      : 'https://artifacts.osci.redhat.com/testing-farm';

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

  // Generate tmt hardware specification
  // See https://tmt.readthedocs.io/en/stable/spec/plans.html#hardware
  // https://gitlab.com/testing-farm/docs/root/-/merge_requests/120/diffs?view=inline
  const rawTmtHardware = getInput('tmt_hardware');
  let tmtHardware: unknown;
  if (rawTmtHardware) {
    tmtHardware = JSON.parse(rawTmtHardware);
  }

  // Conditionally include the name attribute only if tmt_plan_regex is not null
  const tmtPathParsed = tmtPathSchema.safeParse(getInput('tmt_path'));
  const tmtPath = tmtPathParsed.success ? tmtPathParsed.data : '.';

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

  // Conditionally include the name attribute only if tmt_plan_Filter is not null
  const tmtPlanFilterParsed = tmtPlanFilterSchema.safeParse(
    getInput('tmt_plan_filter')
  );
  const tmtPlanFilter = tmtPlanFilterParsed.success
    ? tmtPlanFilterParsed.data
    : undefined;

  // Generate environment settings
  const envSettingsParsed = envSettingsSchema.safeParse(
    JSON.parse(getInput('environment_settings'))
  );
  const envSettings = envSettingsParsed.success ? envSettingsParsed.data : {};

  const pipelineSettings = pipelineSettingsSchema.parse(
    JSON.parse(getInput('pipeline_settings'))
  );

  const ref = getInput('git_ref') || 'master';
  debug(`Using git_ref: '${ref}'`);

  // Schedule a test on Testing Farm
  const composeInput = getInput('compose');
  const environment: any = {
    arch: getInput('arch'),
    variables: tmtEnvVars,
    settings: envSettings,
    secrets: tmtEnvSecrets,
    artifacts: tmtArtifacts,
    tmt: {
      ...(tmtContext ? { context: tmtContext } : {}),
    },
  };

  // Include os field only if compose input is provided and not 'omit'
  // If 'omit', the os field will be completely excluded from the request
  if (composeInput && composeInput.toLowerCase() !== 'omit') {
    environment.os = {
      compose: composeInput,
    };
  }

  const request = {
    test: {
      fmf: {
        url: getInput('git_url', { required: true }),
        ref,
        path: tmtPath,
        plan_filter: tmtPlanFilter,
        ...tmtPlanRegex,
      },
    },
    environments: [environment],
    settings: {
      pipeline: pipelineSettings,
    },
  };

  let tfResponseRaw: unknown;
  if (!rawTmtHardware) {
    // Use newRequest method in case tmt_hardware is not defined or parameter is not properly formatted
    tfResponseRaw = await api.newRequest(request, false);
  } else {
    // The strict mode should be enabled once https://github.com/redhat-plumbers-in-action/testing-farm/issues/71 is fixed
    tfResponseRaw = await api.unsafeNewRequest({
      ...request,
      environments: [{ ...request.environments[0], hardware: tmtHardware }],
    });
  }

  // Remove all secrets from request before printing it
  request.environments.map(
    (env: Partial<(typeof request.environments)[number]>) => delete env.secrets
  );
  debug(
    `Testing Farm request (except environment[].secrets): ${JSON.stringify(
      request,
      null,
      2
    )}`
  );
  debug(`Testing Farm response: ${JSON.stringify(tfResponseRaw, null, 2)}`);

  const tfResponse = requestSchema.parse(tfResponseRaw);
  const tfArtifactUrl = `${tfUrl}/${tfResponse.id}`;
  notice(`Testing Farm logs: ${tfArtifactUrl}`);

  // Set outputs and states
  debug('Setting outputs and states');
  setOutput('request_id', tfResponse.id);
  setOutput('request_url', `${tfInstance}/requests/${tfResponse.id}`);
  setOutput('test_log_url', tfArtifactUrl);
  setTfRequestId(tfResponse.id);
  setTfArtifactUrl(tfArtifactUrl);

  // Create Pull Request status in state pending
  pr.isInitialized() &&
    (await pr.setStatus('pending', 'Build started', `${tfArtifactUrl}`));

  // Interval of 120 seconds in milliseconds
  const interval = 120 * 1000;
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
      `${tfArtifactUrl}`
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

  const summary = new Summary([], {
    id: tfResponse.id,
    name: getInput('pull_request_status_name'),
    runTime: tfResult.run_time || 0,
    created: tfResponse.created,
    updated: tfResponse.updated,
    compose: composeInput && composeInput.toLowerCase() !== 'omit' ? composeInput : null,
    arch: getInput('arch'),
    infrastructureFailure: infraError,
    status: state,
    outcome: result,
    results: [
      `<a href="${tfArtifactUrl}">test</a> `,
      `<a href="${tfArtifactUrl}/pipeline.log">pipeline</a>`,
    ],
  });

  // Switch Pull Request Status to final state
  debug(`Set PR status to ${finalState} with result" ${tfResult.result}`);
  pr.isInitialized() &&
    (await pr.setStatus(
      finalState,
      composeStatusDescription(infraError, getSummary(tfResult.result)),
      `${tfArtifactUrl}`
    ));

  // Add comment with Testing Farm request/result to Pull Request
  if (pr.isInitialized() && getBooleanInput('create_issue_comment')) {
    // Since metadata are fetched at the beginning of the action, we need to refresh them

    do {
      const timeout = Math.floor(Math.random() * 10000);
      debug(`set timeout to ${timeout}`);
      await setTimeout(timeout);
      await pr.metadata.refresh();
    } while (pr.metadata.lock === 'true');
    debug(`metadata unlocked`);

    await pr.metadata.controller.setMetadata(
      pr.number as number,
      'lock',
      'true'
    );
    summary.refreshData(pr.metadata.data);

    debug(`Publish Comment: ${summary.data}`);
    await pr.publishComment(
      `### Testing Farm results
${summary.getTableSummary()}`,
      summary.data
    );

    await pr.metadata.setMetadata(summary.data, 'false');
  }

  // Create Github Summary
  if (getBooleanInput('create_github_summary')) {
    debug(`Creating GitHub Summary`);
    await summary.setJobSummary();
  }

  // Exit with error in case of failure in test
  if (finalState === 'failure') {
    throw new TFError(
      composeStatusDescription(infraError, getSummary(tfResult.result)),
      `${tfArtifactUrl}`
    );
  }
}

export default action;
