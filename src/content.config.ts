import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string(),
    image: z.string().optional(),
    keywords: z.array(z.string()),
    order: z.number().optional(),
  }),
});

const serviceAreas = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/service-areas' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string(),
    image: z.string().optional(),
    keywords: z.array(z.string()),
    order: z.number().optional(),
  }),
});

export const collections = { services, serviceAreas };
