import { z } from 'zod';
export declare const requestSchema: z.ZodObject<{
    id: z.ZodString;
    state: z.ZodString;
    created: z.ZodString;
    updated: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    state: string;
    created: string;
    updated: string;
}, {
    id: string;
    state: string;
    created: string;
    updated: string;
}>;
export type Request = z.infer<typeof requestSchema>;
export declare const requestDetailsSchema: z.ZodObject<{
    id: z.ZodString;
    state: z.ZodString;
    result: z.ZodNullable<z.ZodObject<{
        summary: z.ZodUnion<[z.ZodString, z.ZodNull]>;
        overall: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        summary: string | null;
        overall: string;
    }, {
        summary: string | null;
        overall: string;
    }>>;
    run_time: z.ZodNullable<z.ZodNumber>;
    created: z.ZodString;
    updated: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    state: string;
    created: string;
    updated: string;
    result: {
        summary: string | null;
        overall: string;
    } | null;
    run_time: number | null;
}, {
    id: string;
    state: string;
    created: string;
    updated: string;
    result: {
        summary: string | null;
        overall: string;
    } | null;
    run_time: number | null;
}>;
export type RequestDetails = z.infer<typeof requestDetailsSchema>;
