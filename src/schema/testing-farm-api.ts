import { z } from 'zod';

export const requestSchema = z.object({
  id: z.string(),
});

export type Request = z.infer<typeof requestSchema>;

export const requestDetailsSchema = z.object({
  state: z.string(),
  result: z
    .object({
      summary: z.union([z.string(), z.null()]),
      overall: z.string(),
    })
    .nullable(),
});

export type RequestDetails = z.infer<typeof requestDetailsSchema>;
