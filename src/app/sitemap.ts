import type { MetadataRoute } from 'next'
import { APP_DOMAIN, MARKETING_DOMAIN } from '@/lib/domains'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    // Marketing pages (canonical on marketing domain)
    {
      url: MARKETING_DOMAIN,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${MARKETING_DOMAIN}/roadmap`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${MARKETING_DOMAIN}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${MARKETING_DOMAIN}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${MARKETING_DOMAIN}/security`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    // App pages (public-facing)
    {
      url: `${APP_DOMAIN}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${APP_DOMAIN}/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]
}
