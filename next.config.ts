import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  
  // 启用压缩
  compress: true,
  
  // 优化生产构建
  productionBrowserSourceMaps: false,
  
  // 实验性功能
  experimental: {
    // 优化包导入
    optimizePackageImports: ['react', 'react-dom'],
  },
  
  // 编译优化
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // 在开发模式下抑制由浏览器扩展引起的 hydration 警告
  reactStrictMode: true,
};

export default nextConfig;

import("@opennextjs/cloudflare").then((mod) =>
  mod.initOpenNextCloudflareForDev(),
);
