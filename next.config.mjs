/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // PWA Configuration
  headers: async () => [
    {
      source: '/sw.js',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=0, must-revalidate',
        },
        {
          key: 'Service-Worker-Allowed',
          value: '/',
        },
      ],
    },
    {
      source: '/manifest.json',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'on',
        },
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'origin-when-cross-origin',
        },
        {
          key: 'Content-Security-Policy',
          value: [
            // Default: self
            "default-src 'self'",
            // Scripts: Next.js static, inline scripts, Meta Pixel, PostHog
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://connect.facebook.net https://us.i.posthog.com https://us-assets.i.posthog.com",
            // Script elements (explicit directive to prevent fallback issues)
            "script-src-elem 'self' 'unsafe-inline' https://connect.facebook.net https://us.i.posthog.com https://us-assets.i.posthog.com",
            // Styles: Next.js CSS, inline styles
            "style-src 'self' 'unsafe-inline'",
            // Style elements (explicit directive to prevent fallback issues)
            "style-src-elem 'self' 'unsafe-inline'",
            // Fonts: Next.js optimized fonts
            "font-src 'self' data:",
            // Images: Supabase storage, external CDNs
            "img-src 'self' blob: data: https: https://www.facebook.com https://*.supabase.co",
            // Connect: API calls, WebSocket, Supabase, PostHog
            "connect-src 'self' https: wss: https://*.supabase.co https://us.i.posthog.com wss://hkgcalssjxulsdgqsgvt.supabase.co",
            // Media: Self and blob for uploads
            "media-src 'self' blob: data:",
            // Frames: Meta Pixel noscript fallback
            "frame-src https://www.facebook.com",
          ].join('; '),
        },
        {
          key: 'Cache-Control',
          value: 'no-cache, no-store, must-revalidate, max-age=0',
        },
        {
          key: 'Pragma',
          value: 'no-cache',
        },
        {
          key: 'Expires',
          value: '0',
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(self), microphone=(self), geolocation=(self)',
        },
      ],
    },
  ],
  // Configure external packages for Edge Runtime compatibility
  serverExternalPackages: ['@supabase/ssr', '@supabase/supabase-js'],
  images: {
    unoptimized: false, // Changed to false to fix build issue
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'luevgaxookqykkqw.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co', // All Supabase storage domains
      },
    ],
  },
  // Configure webpack to handle Supabase properly
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
}

export default nextConfig
