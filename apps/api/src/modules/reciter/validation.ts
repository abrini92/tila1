import { z } from 'zod';

export const getReciterSchema = {
  params: z.object({
    id: z.string().min(1, 'Reciter ID is required'),
  }),
};
