/** @type {import('next').NextConfig} */
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@manicuba/shared'],
  async rewrites() {
    return [
      { source: '/files/:path*', destination: `${apiUrl}/files/:path*` },
    ];
  },
};

module.exports = nextConfig;
