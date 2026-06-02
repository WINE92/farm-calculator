import './globals.css'
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: '王者荣耀世界农场计算器',
  description: '实时种菜收益计算',
}

export const viewport: Viewport = {
  width: 1300,
  userScalable: true,
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