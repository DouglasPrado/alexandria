import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@alexandria/ui', '@alexandria/api-client'],
  experimental: {
    middlewareClientMaxBodySize: '10gb',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333'}/api/:path*`,
      },
    ];
  },
  webpack: (config) => {
    // react-pdf usa canvas em Node — alias para false no client bundle
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
