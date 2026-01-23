/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // @sparticuz/chromiumを外部化
      config.externals = [...(config.externals || []), '@sparticuz/chromium'];
    }
    return config;
  },
}

module.exports = nextConfig

