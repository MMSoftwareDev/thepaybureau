import type { MetadataRoute } from 'next'
import { MARKETING_DOMAIN } from '@/lib/domains'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/roadmap', '/terms', '/privacy', '/login', '/signup'],
        disallow: ['/dashboard/', '/api/', '/auth/'],
      },
    ],
    sitemap: `${MARKETING_DOMAIN}/sitemap.xml`,
  }
}
