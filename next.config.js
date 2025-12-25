/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: '/tmp/.next',
  reactStrictMode: true,
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-left',
  },
};

module.exports = nextConfig;
