'use client'

import { useState, useEffect } from 'react'

export default function MobileWarning() {
  const [isMobile, setIsMobile] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // 检测是否为移动端（简单 UserAgent 匹配）
    const userAgent = navigator.userAgent || window.navigator.userAgent
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone/i
    const isMobileDevice = mobileRegex.test(userAgent)
    setIsMobile(isMobileDevice)

    // 读取 localStorage，如果已经关闭过就不再显示
    const hasDismissed = localStorage.getItem('mobileWarningDismissed')
    if (hasDismissed === 'true') {
      setDismissed(true)
    }
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('mobileWarningDismissed', 'true')
  }

  if (!isMobile || dismissed) return null

  return (
    <div className="sticky top-0 z-50 bg-yellow-600 text-white text-sm p-3 flex justify-between items-center shadow-lg">
      <div className="text-xl flex-1 text-left">
        编者注 当前页面未做移动端适配
          <p className="text-sm flex-1 text-left">
            * 请手动缩放使用或前往桌面端网页以获得最佳体验  - WINE
          </p>
      </div>
      <button
        onClick={handleDismiss}
        className="ml-3 bg-black/30 hover:bg-black/50 rounded-full w-6 h-6 flex items-center justify-center"
        aria-label="关闭"
      >
        ✕
      </button>
    </div>
  )
}