/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // chrome-aws-lambdaとpuppeteerを外部化
      config.externals = [
        ...(config.externals || []),
        'chrome-aws-lambda',
        'puppeteer-core',
        'puppeteer',
      ];
      
      // .mapファイルとbinary filesを無視
      config.module = config.module || {};
      config.module.rules = config.module.rules || [];
      config.module.rules.push({
        test: /\.map$/,
        use: 'ignore-loader',
      });
      
      // chrome-aws-lambdaの不要なファイルを無視
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...config.resolve.alias,
        'chrome-aws-lambda': 'chrome-aws-lambda/build/index.js',
      };
    }
    return config;
  },
}

module.exports = nextConfig