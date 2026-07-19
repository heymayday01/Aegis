import type { MetadataRoute } from 'next';

/**
 * sitemap.xml — generated at build/runtime by Next.js.
 * Aegis is a single-page app, so we only have one URL.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://aegis.vercel.app';
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ];
}
