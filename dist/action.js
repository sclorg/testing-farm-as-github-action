import { debug, getBooleanInput, getInput, notice, setOutput, summary, } from '@actions/core';
import { context } from '@actions/github';
import TestingFarmAPI from 'testing-farm';
import { setTimeout } from 'timers/promises';
import { PullRequest } from './pull-request';
import { envSettingsSchema, tfScopeSchema, timeoutSchema, tmtArtifactsInputSchema, tmtArtifactsSchema, tmtContextInputSchema, tmtContextSchema, tmtEnvSecretsSchema, tmtEnvVarsSchema, } from './schema/input';
async function action(octokit) {
    const pr = await PullRequest.initialize(context.issue.number, octokit);
    const tfInstance = getInput('api_url');
    const api = new TestingFarmAPI(tfInstance);
    // Get commit SHA value
    let sha = getInput('pr_head_sha');
    if (sha === '') {
        sha = pr.sha;
    }
    debug(`SHA: '${sha}'`);
    // Set artifacts url
    const tfScopeParsed = tfScopeSchema.safeParse(getInput('tf_scope'));
    const tfScope = tfScopeParsed.success ? tfScopeParsed.data : 'public';
    const tfArtifactUrl = tfScope === 'public'
        ? 'https://artifacts.dev.testing-farm.io'
        : 'http://artifacts.osci.redhat.com/testing-farm';
    // Generate tmt variables
    const tmtEnvVarsParsed = tmtEnvVarsSchema.safeParse(getInput('variables'));
    const tmtEnvVars = tmtEnvVarsParsed.success ? tmtEnvVarsParsed.data : {};
    // Generate tmt secrets
    const tmtEnvSecretsParsed = tmtEnvSecretsSchema.safeParse(getInput('secrets'));
    const tmtEnvSecrets = tmtEnvSecretsParsed.success
        ? tmtEnvSecretsParsed.data
        : {};
    // Generate tmt artifacts
    const tmtArtifactsParsed = tmtArtifactsInputSchema.safeParse(getInput('copr_artifacts'));
    const tmtArtifacts = tmtArtifactsParsed.success
        ? tmtArtifactsSchema.parse(tmtArtifactsParsed.data)
        : [];
    // Generate tmt context
    const tmtContextParsed = tmtContextInputSchema.safeParse(getInput('tmt_context'));
    const tmtContext = tmtContextParsed.success
        ? tmtContextSchema.parse(tmtContextParsed.data)
        : undefined;
    // Generate environment settings
    const envSettingsParsed = envSettingsSchema.safeParse(JSON.parse(getInput('environment_settings')));
    const envSettings = envSettingsParsed.success ? envSettingsParsed.data : {};
    // Schedule a test on Testing Farm
    const request = {
        api_key: getInput('api_key', { required: true }),
        test: {
            fmf: {
                url: getInput('git_url', { required: true }),
                ref: getInput('git_ref'),
                name: getInput('tmt_plan_regex'),
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
                tmt: Object.assign({}, (tmtContext ? { context: tmtContext } : {})),
            },
        ],
    };
    // The strict mode should be enabled once https://github.com/redhat-plumbers-in-action/testing-farm/issues/71 is fixed
    const tfResponse = (await api.newRequest(request, false));
    // Remove all secrets from request before printing it
    delete request.api_key;
    request.environments.map((env) => delete env.secrets);
    debug(`Testing Farm request (except api_key and environment[].secrets): ${JSON.stringify(request, null, 2)}`);
    debug(`Testing Farm response: ${JSON.stringify(tfResponse, null, 2)}`);
    // Create Pull Request status in state pending
    const usePullRequestStatuses = getBooleanInput('update_pull_request_status');
    if (usePullRequestStatuses) {
        await pr.setStatus('pending', 'Build started', `${tfArtifactUrl}/${tfResponse.id}`);
    }
    // Interval of 30 seconds in milliseconds
    const interval = 30 * 1000;
    const parsedTimeout = timeoutSchema.safeParse(getInput('timeout'));
    // set timeout to 960 * 30 seconds ~ 8 hours ; timeout from input is in minutes (hence * 2)
    let timeout = parsedTimeout.success ? parsedTimeout.data * 2 : 960;
    let tfResult;
    // Check if scheduled test is still running
    // Ask Testing Farm every 30 seconds
    debug(`Testing Farm - waiting for results (timeout: ${timeout} minutes)`);
    do {
        tfResult = await api.requestDetails(tfResponse.id);
        if (tfResult.state !== 'running' &&
            tfResult.state !== 'new' &&
            tfResult.state !== 'pending' &&
            tfResult.state !== 'queued') {
            break;
        }
        debug(`Testing Farm - state: '${tfResult.state}'`);
        timeout--;
        await setTimeout(interval);
    } while (timeout > 0);
    if (timeout === 0) {
        await pr.setStatus('failure', 'Timeout reached', `${tfArtifactUrl}/${tfResponse.id}`);
        throw new Error(`Testing Farm - timeout reached. The test is still in state: '${tfResult.state}'`);
    }
    debug(`response:'${JSON.stringify(tfResult, null, 2)}'`);
    // Get final state of Testing Farm scheduled request
    const state = tfResult.state;
    const result = tfResult.result.overall;
    let finalState = 'success';
    let infraError = '';
    let log = '';
    notice(`State is ${state} and result is: ${result}`);
    if (state === 'complete') {
        if (result !== 'passed') {
            finalState = 'failure';
        }
    }
    else {
        // Mark job in case of infrastructure issues. Report to Testing Farm team
        infraError = '- Infra problems';
        finalState = 'failure';
        log = 'pipeline.log';
    }
    notice(`Final state is: ${finalState}`);
    notice(`Infra state is: ${infraError}`);
    // Set outputs
    setOutput('request_id', tfResponse.id);
    setOutput('request_url', `${tfInstance}/requests/${tfResponse.id}`);
    // Switch Pull Request Status to final state
    if (usePullRequestStatuses) {
        await pr.setStatus(finalState, `Build finished ${infraError}`, `${tfArtifactUrl}/${tfResponse.id}`);
    }
    // Add comment with Testing Farm request/result to Pull Request
    if (getBooleanInput('create_issue_comment')) {
        await pr.addComment(`Testing Farm [request](${tfInstance}/requests/${tfResponse.id}) for ${getInput('compose')}/${getInput('copr_artifacts')} regression testing has been created.` +
            `Once finished, results should be available [here](${tfArtifactUrl}/${tfResponse.id}/).\n` +
            `[Full pipeline log](${tfArtifactUrl}/${tfResponse.id}/pipeline.log).`, octokit);
    }
    // Create Github Summary
    if (getBooleanInput('create_github_summary')) {
        if (infraError === '') {
            infraError = 'OK';
        }
        else {
            infraError = 'Failed';
        }
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
                infraError,
                finalState,
                `${tfArtifactUrl}/${tfResponse.id}/pipeline.log`,
            ],
        ])
            .write();
    }
    // Exit with error in case of failure in test
    if (finalState === 'failure') {
        throw new Error(`Testing Farm test failed - ${tfResult.result.summary}`);
    }
}
export default action;
//# sourceMappingURL=action.js.map