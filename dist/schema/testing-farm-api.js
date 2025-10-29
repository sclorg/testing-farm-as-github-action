import { z } from 'zod';
export const requestSchema = z.object({
    id: z.string(),
    state: z.string(),
    created: z.string(),
    updated: z.string(),
});
export const requestDetailsSchema = z.object({
    id: z.string(),
    state: z.string(),
    result: z
        .object({
        summary: z.union([z.string(), z.null()]),
        overall: z.string(),
    })
        .nullable(),
    run_time: z.number().nullable(),
    created: z.string(),
    updated: z.string(),
});
export const whoamiSchema = z.object({
    token: z.object({
        created: z.string(),
        enabled: z.boolean(),
        id: z.string(),
        name: z.string(),
        ranch: z.enum(['public', 'private']),
        role: z.string(),
        updated: z.string(),
        user_id: z.string(),
    }),
    user: z.object({
        auth_id: z.string(),
        auth_method: z.string(),
        auth_name: z.string(),
        created: z.string(),
        enabled: z.boolean(),
        id: z.string(),
        updated: z.string(),
    }),
});
//# sourceMappingURL=testing-farm-api.js.map