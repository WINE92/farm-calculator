// next.config.ts
import type { NextConfig } from 'next'
import withPWA from 'next-pwa'

const nextConfig: NextConfig = {
  reactStrictMode: true,
}

// 只在生产构建时启用 PWA，开发时完全禁用
const config = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // 关键：开发模式禁用
})(nextConfig)

export default config