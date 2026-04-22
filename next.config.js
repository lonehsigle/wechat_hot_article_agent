/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  outputFileTracingRoot: __dirname,
  output: 'standalone',

  // 安全头配置
  async headers() {
    return [
      {
        // 匹配所有路由
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        // API路由禁用缓存
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
        ],
      },
    ];
  },

  // 生产环境优化
  productionBrowserSourceMaps: false,

  // 压缩配置
  compress: true,

  // 运行时配置
  serverRuntimeConfig: {
    // 只有服务端能访问的配置
    encryptionKey: process.env.DB_ENCRYPTION_KEY,
  },

  // 公共配置（客户端和服务端都能访问）
  publicRuntimeConfig: {
    env: process.env.NODE_ENV,
  },
};

module.exports = nextConfig;
