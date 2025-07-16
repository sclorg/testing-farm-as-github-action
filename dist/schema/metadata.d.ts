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
    results: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type Data = z.infer<typeof dataSchema>;
export declare const issueMetadataObjectSchema: z.ZodObject<{
    "comment-id": z.ZodOptional<z.ZodString>;
    lock: z.ZodUnion<readonly [z.ZodLiteral<"true">, z.ZodLiteral<"false">]>;
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
        results: z.ZodArray<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type IssueMetadataObject = z.infer<typeof issueMetadataObjectSchema>;
