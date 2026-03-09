import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thepaybureau.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/terms', '/privacy', '/login', '/signup'],
        disallow: ['/dashboard/', '/api/', '/auth/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
