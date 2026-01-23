/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // chrome-aws-lambdaのソースマップを除外
      config.module.rules.push({
        test: /\.map$/,
        use: 'ignore-loader',
      });
      
      // chrome-aws-lambdaを外部化
      config.externals = [...(config.externals || []), 'chrome-aws-lambda'];
    }
    return config;
  },
}

module.exports = nextConfig

