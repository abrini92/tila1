import { z } from 'zod';

export const feedQuerySchema = {
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    pageSize: z.string().regex(/^\d+$/).optional(),
  }).optional(),
};
