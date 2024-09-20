import { z } from 'zod';
export const commentIdKey = 'comment-id';
// TODO: make some members literal types???
export const dataSchema = z.object({
    id: z.string(),
    name: z.string(),
    status: z.string(),
    outcome: z.string().optional(),
    runTime: z.number(),
    created: z.string(),
    updated: z.string(),
    compose: z.string(),
    arch: z.string(),
    infrastructureFailure: z.boolean(),
    results: z.array(z.string()),
});
export const issueMetadataObjectSchema = z.object({
    [commentIdKey]: z.string().optional(),
    lock: z.union([z.literal('true'), z.literal('false')]),
    data: z.array(dataSchema),
});
//# sourceMappingURL=metadata.js.map