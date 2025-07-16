import { z } from 'zod';
export declare const requestSchema: z.ZodObject<{
    id: z.ZodString;
    state: z.ZodString;
    created: z.ZodString;
    updated: z.ZodString;
}, z.core.$strip>;
export type Request = z.infer<typeof requestSchema>;
export declare const requestDetailsSchema: z.ZodObject<{
    id: z.ZodString;
    state: z.ZodString;
    result: z.ZodNullable<z.ZodObject<{
        summary: z.ZodUnion<readonly [z.ZodString, z.ZodNull]>;
        overall: z.ZodString;
    }, z.core.$strip>>;
    run_time: z.ZodNullable<z.ZodNumber>;
    created: z.ZodString;
    updated: z.ZodString;
}, z.core.$strip>;
export type RequestDetails = z.infer<typeof requestDetailsSchema>;
