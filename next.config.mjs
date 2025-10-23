/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Configure external packages for Edge Runtime compatibility
  serverExternalPackages: ['@supabase/ssr', '@supabase/supabase-js'],
  images: {
    unoptimized: false, // Changed to false to fix build issue
    domains: [
      'luevgaxookqykkqw.public.blob.vercel-storage.com', 
      'cdn.discordapp.com', 
      'lh3.googleusercontent.com', 
      'avatars.githubusercontent.com'
    ],
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
}

export default nextConfig