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
    packages?: string[] | undefined;
    install?: boolean | undefined;
    order?: number | undefined;
}, {
    id: string;
    type: string;
    packages?: string[] | undefined;
    install?: boolean | undefined;
    order?: number | undefined;
}>, "many">>;
export declare const tmtContextSchema: z.ZodUnion<[z.ZodOptional<z.ZodObject<{
    distro: z.ZodString;
    arch: z.ZodString;
    trigger: z.ZodString;
}, "strip", z.ZodTypeAny, {
    distro: string;
    arch: string;
    trigger: string;
}, {
    distro: string;
    arch: string;
    trigger: string;
}>>, z.ZodEffects<z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>, undefined, {}>]>;
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
export declare const timeoutSchema: z.ZodNumber;
