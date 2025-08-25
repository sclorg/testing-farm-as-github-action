import { z } from 'zod';
export declare const tfScopeSchema: z.ZodEnum<{
    private: "private";
    public: "public";
}>;
export declare const tmtEnvVarsSchema: z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<string[], string>>, z.ZodTransform<Record<string, string>, string[]>>;
export declare const tmtEnvSecretsSchema: z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<string[], string>>, z.ZodTransform<Record<string, string>, string[]>>;
export declare const tmtArtifactsInputSchema: z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<string[], string>>, z.ZodTransform<{
    id: string;
    type: string;
    packages?: string[] | undefined;
}[], string[]>>;
export declare const tmtContextInputSchema: z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<string[], string>>, z.ZodTransform<Record<string, string>, string[]>>;
export declare const tmtArtifactsSchema: z.ZodDefault<z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    type: z.ZodString;
    packages: z.ZodOptional<z.ZodArray<z.ZodString>>;
    install: z.ZodOptional<z.ZodBoolean>;
    order: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>>>;
export declare const tmtContextSchema: z.ZodObject<{
    distro: z.ZodOptional<z.ZodString>;
    variant: z.ZodOptional<z.ZodString>;
    arch: z.ZodOptional<z.ZodString>;
    component: z.ZodOptional<z.ZodString>;
    collection: z.ZodOptional<z.ZodString>;
    module: z.ZodOptional<z.ZodString>;
    initiator: z.ZodOptional<z.ZodString>;
    trigger: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const envSettingsSchema: z.ZodOptional<z.ZodObject<{
    pipeline: z.ZodOptional<z.ZodObject<{
        skip_guest_setup: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>;
    provisioning: z.ZodOptional<z.ZodObject<{
        post_install_script: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, z.core.$strip>>;
}, z.core.$strip>>;
export declare const pipelineSettingsSchema: z.ZodOptional<z.ZodObject<{
    timeout: z.ZodOptional<z.ZodNumber>;
    type: z.ZodOptional<z.ZodEnum<{
        "tmt-multihost": "tmt-multihost";
    }>>;
    'provision-error-failed-result': z.ZodOptional<z.ZodBoolean>;
    'parallel-limit': z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>>;
export declare const timeoutSchema: z.ZodCoercedNumber<unknown>;
export declare const tmtPlanRegexSchema: z.ZodString;
export declare const tmtPlanFilterSchema: z.ZodString;
export declare const tmtPathSchema: z.ZodString;
