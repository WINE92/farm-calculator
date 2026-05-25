import './globals.css'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '王者荣耀世界农场计算器',
  description: '实时种菜收益计算',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}