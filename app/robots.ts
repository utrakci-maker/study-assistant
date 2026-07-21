import { MetadataRoute } from 'next'

const BASE_URL = 'https://study-assistant-ashy.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/', '/account', '/dashboard', '/results/'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
