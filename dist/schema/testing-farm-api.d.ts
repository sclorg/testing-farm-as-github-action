import { z } from 'zod';
export declare const requestSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export type Request = z.infer<typeof requestSchema>;
export declare const requestDetailsSchema: z.ZodObject<{
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
}, "strip", z.ZodTypeAny, {
    state: string;
    result: {
        summary: string | null;
        overall: string;
    } | null;
}, {
    state: string;
    result: {
        summary: string | null;
        overall: string;
    } | null;
}>;
export type RequestDetails = z.infer<typeof requestDetailsSchema>;
