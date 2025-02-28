// src/schemas/fileWriteSchema.ts
import { z } from 'zod';

export const FileWriteSchema = z.object({
  type: z.string(), // z.B. "page", "blog"
  slug: z.string().min(1, { message: 'Slug darf nicht leer sein' }),
  content: z.string().min(1, { message: 'Content darf nicht leer sein' }),
  ext: z.string().optional().default('mdx'),
  branch: z.string().optional(), // Falls nicht angegeben, setzt das Backend den Standard
  message: z.string().optional(),
});

export type FileWriteInput = z.infer<typeof FileWriteSchema>;
