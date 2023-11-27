import { z } from 'zod';
export const requestSchema = z.object({
    id: z.string(),
});
export const requestDetailsSchema = z.object({
    state: z.string(),
    result: z.object({
        summary: z.union([z.string(), z.null()]),
        overall: z.string(),
    }),
});
//# sourceMappingURL=testing-farm-api.js.map