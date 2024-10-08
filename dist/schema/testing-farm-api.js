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
//# sourceMappingURL=testing-farm-api.js.map