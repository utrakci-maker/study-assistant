/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevents the site from being loaded in an iframe (clickjacking protection)
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // Prevents browsers from guessing file types (MIME sniffing attacks)
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Forces HTTPS for 2 years, including subdomains
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          // Controls how much referrer info is sent when navigating away
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Disables browser features we don't need (camera, mic, location)
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
          // Legacy XSS filter — still useful for older browsers
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // Prevents DNS prefetching from leaking visited URLs
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ]
  },
}

export default nextConfig
