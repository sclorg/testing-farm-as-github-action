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
export declare const whoamiSchema: z.ZodObject<{
    token: z.ZodObject<{
        created: z.ZodString;
        enabled: z.ZodBoolean;
        id: z.ZodString;
        name: z.ZodString;
        ranch: z.ZodEnum<{
            private: "private";
            public: "public";
        }>;
        role: z.ZodString;
        updated: z.ZodString;
        user_id: z.ZodString;
    }, z.core.$strip>;
    user: z.ZodObject<{
        auth_id: z.ZodString;
        auth_method: z.ZodString;
        auth_name: z.ZodString;
        created: z.ZodString;
        enabled: z.ZodBoolean;
        id: z.ZodString;
        updated: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export type Whoami = z.infer<typeof whoamiSchema>;
