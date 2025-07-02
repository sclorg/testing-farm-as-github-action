import { z } from 'zod';
export declare const commentIdKey = "comment-id";
export declare const dataSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    status: z.ZodString;
    outcome: z.ZodOptional<z.ZodString>;
    runTime: z.ZodNumber;
    created: z.ZodString;
    updated: z.ZodString;
    compose: z.ZodNullable<z.ZodString>;
    arch: z.ZodString;
    infrastructureFailure: z.ZodBoolean;
    results: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    status: string;
    runTime: number;
    created: string;
    updated: string;
    compose: string | null;
    arch: string;
    infrastructureFailure: boolean;
    results: string[];
    outcome?: string | undefined;
}, {
    id: string;
    name: string;
    status: string;
    runTime: number;
    created: string;
    updated: string;
    compose: string | null;
    arch: string;
    infrastructureFailure: boolean;
    results: string[];
    outcome?: string | undefined;
}>;
export type Data = z.infer<typeof dataSchema>;
export declare const issueMetadataObjectSchema: z.ZodObject<{
    "comment-id": z.ZodOptional<z.ZodString>;
    lock: z.ZodUnion<[z.ZodLiteral<"true">, z.ZodLiteral<"false">]>;
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        status: z.ZodString;
        outcome: z.ZodOptional<z.ZodString>;
        runTime: z.ZodNumber;
        created: z.ZodString;
        updated: z.ZodString;
        compose: z.ZodNullable<z.ZodString>;
        arch: z.ZodString;
        infrastructureFailure: z.ZodBoolean;
        results: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        status: string;
        runTime: number;
        created: string;
        updated: string;
        compose: string | null;
        arch: string;
        infrastructureFailure: boolean;
        results: string[];
        outcome?: string | undefined;
    }, {
        id: string;
        name: string;
        status: string;
        runTime: number;
        created: string;
        updated: string;
        compose: string | null;
        arch: string;
        infrastructureFailure: boolean;
        results: string[];
        outcome?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    lock: "true" | "false";
    data: {
        id: string;
        name: string;
        status: string;
        runTime: number;
        created: string;
        updated: string;
        compose: string | null;
        arch: string;
        infrastructureFailure: boolean;
        results: string[];
        outcome?: string | undefined;
    }[];
    "comment-id"?: string | undefined;
}, {
    lock: "true" | "false";
    data: {
        id: string;
        name: string;
        status: string;
        runTime: number;
        created: string;
        updated: string;
        compose: string | null;
        arch: string;
        infrastructureFailure: boolean;
        results: string[];
        outcome?: string | undefined;
    }[];
    "comment-id"?: string | undefined;
}>;
export type IssueMetadataObject = z.infer<typeof issueMetadataObjectSchema>;
