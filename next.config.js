/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add empty turbopack config to silence warning
  turbopack: {},
  webpack: (config) => {
    // Add support for canvas (required by pdf-parse)
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
};

module.exports = nextConfig;
