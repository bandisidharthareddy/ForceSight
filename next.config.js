/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  trailingSlash: false,
  async rewrites() {
    return [
      {
        source: '/telemetry',
        destination: '/api/telemetry',
      },
    ];
  },
};

module.exports = nextConfig;
