import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@alexandria/ui', '@alexandria/api-client'],
};

export default nextConfig;
