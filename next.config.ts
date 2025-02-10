import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  //experimental: {
  //  ppr: true,
  //},
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
    ],
  },
  
  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        destination: 'https://dev-coffeeconnect-v1.firebaseapp.com/__/auth/:path*',
      },
    ]
  },
};

export default nextConfig;