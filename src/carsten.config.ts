// carsten.config.ts
import { z } from 'zod';

// Basis-Schema für Felder
export const FieldSchema = z.object({
  name: z.string(), // z. B. "title", "slug", "content"
  type: z.enum(['string', 'text', 'number', 'boolean', 'date', 'image', 'mdx', 'relation']),
  required: z.boolean().optional(),
});

// Content-Type-Schema ohne expliziten repoFolder
export const ContentTypeSchema = z.object({
  id: z.string(), // z. B. "page", "blog", "user"
  name: z.string(), // Anzeigename, z. B. "Seite", "Blog", "Benutzer"
  fields: z.array(FieldSchema),
});

// Globales CMS-Konfigurationsschema, jetzt mit MediaFolder
export const CMSConfigSchema = z.object({
  baseFolder: z.string().default('content'), // Globaler Base-Path im Repository
  mediaFolder: z.string().default('public/media'), // Pfad zur Mediathek
  contentTypes: z.array(ContentTypeSchema),
  mdxComponents: z.record(z.string()),
});

export type CMSConfig = z.infer<typeof CMSConfigSchema>;

// Beispielhafte Konfiguration – hier definieren wir die Content-Typen
export const cmsConfig: CMSConfig = {
  baseFolder: 'content',
  mediaFolder: 'public/media',
  contentTypes: [
    {
      id: 'page',
      name: 'Seite',
      fields: [
        { name: 'title', type: 'string', required: true },
        { name: 'slug', type: 'string', required: true },
        { name: 'content', type: 'mdx', required: true },
      ],
    },
    {
      id: 'blog',
      name: 'Blog',
      fields: [
        { name: 'title', type: 'string', required: true },
        { name: 'slug', type: 'string', required: true },
        { name: 'excerpt', type: 'text' },
        { name: 'content', type: 'mdx', required: true },
        { name: 'publishedAt', type: 'date', required: true },
      ],
    },
    {
      id: 'user',
      name: 'Benutzer',
      fields: [
        { name: 'name', type: 'string', required: true },
        { name: 'email', type: 'string', required: true },
        { name: 'role', type: 'string', required: true },
      ],
    },
  ],
  mdxComponents: {
    Button: '@/components/mdx/Button',
    Gallery: '@/components/mdx/Gallery',
  },
};
