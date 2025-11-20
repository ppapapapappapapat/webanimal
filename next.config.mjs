/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // ✅ Essential for Railway
  trailingSlash: true,
  reactStrictMode: true,
  poweredByHeader: false,
  
  images: {
    domains: ['images.unsplash.com', 'localhost', '*.up.railway.app'], // ✅ Add Railway domain
    formats: ['image/avif', 'image/webp'],
    unoptimized: true, // ✅ Important for Railway
  },
  
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  }
};

export default nextConfig;