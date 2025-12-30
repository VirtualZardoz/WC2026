/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: '.next',
  reactStrictMode: true,
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-left',
  },

  // Security headers
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            // Prevent clickjacking
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            // Prevent MIME type sniffing
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            // XSS protection (legacy browsers)
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            // Referrer policy
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            // Permissions policy (formerly Feature-Policy)
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            // Content Security Policy
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires these
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // Google Fonts styles
              "img-src 'self' data: blob: https://flagcdn.com https://images.unsplash.com", // Flags + hero images
              "font-src 'self' https://fonts.gstatic.com", // Google Fonts
              "connect-src 'self'",
              "frame-ancestors 'self'",
              "form-action 'self'",
              "base-uri 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
