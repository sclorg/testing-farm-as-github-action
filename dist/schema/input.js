import { z } from 'zod';
export const tfScopeSchema = z.enum(['public', 'private']);
// Parse string input into object of key-value pairs
// input: 'REPO_URL=GITHUB_SERVER_URL/GITHUB_REPOSITORY;REPO_NAME=GITHUB_REPOSITORY'
// output: { REPO_URL: 'GITHUB_SERVER_URL/GITHUB_REPOSITORY', REPO_NAME: 'GITHUB_REPOSITORY' }
const stringToArraySchema = z.string().transform(str => str.split(';'));
const keyValueArrayToObjectSchema = stringToArraySchema.transform(arr => {
    let obj = {};
    arr.forEach(item => {
        const [key, ...values] = item.split('=');
        // ''.split('=') returns [''] ; we have to check for this case
        if (key === '' && Array.isArray(values) && values.length === 0)
            return;
        obj[key] = values.join('=');
    });
    return z.record(z.string(), z.string()).parse(obj);
});
export const tmtEnvVarsSchema = keyValueArrayToObjectSchema;
export const tmtEnvSecretsSchema = keyValueArrayToObjectSchema;
export const tmtArtifactsInputSchema = stringToArraySchema.transform(arr => {
    let artifacts = [];
    arr.forEach(item => {
        if (item === '')
            return;
        artifacts.push({ type: 'fedora-copr-build', id: item });
    });
    return artifacts;
});
export const tmtContextInputSchema = keyValueArrayToObjectSchema;
// https://api.testing-farm.io/redoc#operation/request_a_new_test_v0_1_requests_post
export const tmtArtifactsSchema = z
    .array(z.object({
    id: z.string().min(1),
    type: z.string().min(1),
    packages: z.array(z.string().min(1)).optional(),
    install: z.boolean().optional(),
    order: z.number().optional(),
}))
    .default([]);
// https://api.testing-farm.io/redoc#operation/request_a_new_test_v0_1_requests_post
// https://tmt.readthedocs.io/en/stable/spec/context.html#dimension
export const tmtContextSchema = z.looseObject({
    distro: z.string().min(1).optional(),
    variant: z.string().min(1).optional(),
    arch: z.string().min(1).optional(),
    component: z.string().min(1).optional(),
    collection: z.string().min(1).optional(),
    module: z.string().min(1).optional(),
    initiator: z.string().min(1).optional(),
    trigger: z.string().min(1).optional(),
});
export const envSettingsSchema = z
    .object({
    pipeline: z
        .object({
        skip_guest_setup: z.boolean().optional(),
    })
        .optional(),
    provisioning: z
        .object({
        post_install_script: z.string().min(1).optional(),
        tags: z.record(z.string(), z.string()).optional(),
    })
        .optional(),
})
    .optional();
export const pipelineSettingsSchema = z
    .object({
    timeout: z.number().min(1).optional(),
    type: z.enum(['tmt-multihost']).optional(),
    'provision-error-failed-result': z.boolean().optional(),
    'parallel-limit': z.number().nonnegative().optional(),
})
    .optional();
export const timeoutSchema = z.coerce.number();
export const tmtPlanRegexSchema = z.string().min(1);
export const tmtPlanFilterSchema = z.string().min(1);
export const tmtPathSchema = z.string().min(1);
//# sourceMappingURL=input.js.map