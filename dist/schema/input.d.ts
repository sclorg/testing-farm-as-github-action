import { z } from 'zod';
export declare const tfScopeSchema: z.ZodEnum<["public", "private"]>;
export declare const tmtEnvVarsSchema: z.ZodEffects<z.ZodEffects<z.ZodString, string[], string>, Record<string, string>, string>;
export declare const tmtEnvSecretsSchema: z.ZodEffects<z.ZodEffects<z.ZodString, string[], string>, Record<string, string>, string>;
export declare const tmtArtifactsInputSchema: z.ZodEffects<z.ZodEffects<z.ZodString, string[], string>, {
    type: string;
    id: string;
    packages?: string[] | undefined;
}[], string>;
export declare const tmtContextInputSchema: z.ZodEffects<z.ZodEffects<z.ZodString, string[], string>, Record<string, string>, string>;
export declare const tmtArtifactsSchema: z.ZodDefault<z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    type: z.ZodString;
    packages: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    install: z.ZodOptional<z.ZodBoolean>;
    order: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: string;
    order?: number | undefined;
    packages?: string[] | undefined;
    install?: boolean | undefined;
}, {
    id: string;
    type: string;
    order?: number | undefined;
    packages?: string[] | undefined;
    install?: boolean | undefined;
}>, "many">>;
export declare const tmtContextSchema: z.ZodObject<{
    distro: z.ZodOptional<z.ZodString>;
    variant: z.ZodOptional<z.ZodString>;
    arch: z.ZodOptional<z.ZodString>;
    component: z.ZodOptional<z.ZodString>;
    collection: z.ZodOptional<z.ZodString>;
    module: z.ZodOptional<z.ZodString>;
    initiator: z.ZodOptional<z.ZodString>;
    trigger: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    distro?: string | undefined;
    variant?: string | undefined;
    arch?: string | undefined;
    component?: string | undefined;
    collection?: string | undefined;
    module?: string | undefined;
    initiator?: string | undefined;
    trigger?: string | undefined;
}, {
    distro?: string | undefined;
    variant?: string | undefined;
    arch?: string | undefined;
    component?: string | undefined;
    collection?: string | undefined;
    module?: string | undefined;
    initiator?: string | undefined;
    trigger?: string | undefined;
}>;
export declare const envSettingsSchema: z.ZodOptional<z.ZodObject<{
    pipeline: z.ZodOptional<z.ZodObject<{
        skip_guest_setup: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        skip_guest_setup?: boolean | undefined;
    }, {
        skip_guest_setup?: boolean | undefined;
    }>>;
    provisioning: z.ZodOptional<z.ZodObject<{
        post_install_script: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        post_install_script?: string | undefined;
        tags?: Record<string, string> | undefined;
    }, {
        post_install_script?: string | undefined;
        tags?: Record<string, string> | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    pipeline?: {
        skip_guest_setup?: boolean | undefined;
    } | undefined;
    provisioning?: {
        post_install_script?: string | undefined;
        tags?: Record<string, string> | undefined;
    } | undefined;
}, {
    pipeline?: {
        skip_guest_setup?: boolean | undefined;
    } | undefined;
    provisioning?: {
        post_install_script?: string | undefined;
        tags?: Record<string, string> | undefined;
    } | undefined;
}>>;
export declare const pipelineSettingsSchema: z.ZodOptional<z.ZodObject<{
    timeout: z.ZodOptional<z.ZodNumber>;
    type: z.ZodOptional<z.ZodEnum<["tmt-multihost"]>>;
    'provision-error-failed-result': z.ZodOptional<z.ZodBoolean>;
    'parallel-limit': z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    timeout?: number | undefined;
    type?: "tmt-multihost" | undefined;
    'provision-error-failed-result'?: boolean | undefined;
    'parallel-limit'?: number | undefined;
}, {
    timeout?: number | undefined;
    type?: "tmt-multihost" | undefined;
    'provision-error-failed-result'?: boolean | undefined;
    'parallel-limit'?: number | undefined;
}>>;
export declare const timeoutSchema: z.ZodNumber;
export declare const tmtPlanRegexSchema: z.ZodString;
export declare const tmtPathSchema: z.ZodString;
