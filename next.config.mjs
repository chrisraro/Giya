/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
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
}

export default nextConfig
