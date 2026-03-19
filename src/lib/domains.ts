export const APP_DOMAIN =
  process.env.NEXT_PUBLIC_APP_URL || 'https://app.thepaybureau.com'

export const MARKETING_DOMAIN =
  process.env.NEXT_PUBLIC_MARKETING_URL || 'https://www.thepaybureau.com'

// Routes served on the marketing domain (www.thepaybureau.com)
export const MARKETING_ROUTES = ['/', '/roadmap', '/terms', '/privacy', '/security']
