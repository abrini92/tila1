import { z } from 'zod';

export const createRecitationSchema = {
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    description: z.string().max(1000, 'Description too long').optional(),
    surah: z.string().regex(/^\d+$/, 'Surah must be a number'),
    verses: z.string().regex(/^\d+-\d+$/, 'Verses must be in format "start-end"'),
    language: z.string().length(2, 'Language must be 2 characters').optional(),
  }),
};

export const uploadAudioSchema = {
  params: z.object({
    id: z.string().min(1, 'Recitation ID is required'),
  }),
  body: z.object({
    audioData: z.string().min(1, 'Audio data is required'),
  }),
};

export const getRecitationSchema = {
  params: z.object({
    id: z.string().min(1, 'Recitation ID is required'),
  }),
};
