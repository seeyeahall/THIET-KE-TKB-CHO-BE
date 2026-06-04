/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'dist_new',
  images: { unoptimized: true },
};
module.exports = nextConfig;
