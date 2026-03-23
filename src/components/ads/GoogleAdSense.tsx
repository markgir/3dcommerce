'use client'

import { useEffect, useRef } from 'react'

interface GoogleAdSenseProps {
  adSlot: string
  adFormat?: string
  fullWidthResponsive?: boolean
  className?: string
}

export default function GoogleAdSense({
  adSlot,
  adFormat = 'auto',
  fullWidthResponsive = true,
  className = '',
}: GoogleAdSenseProps) {
  const adRef = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    try {
      // @ts-expect-error adsbygoogle is injected by Google
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {}
  }, [])

  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID

  if (!publisherId) {
    return (
      <div
        className={`bg-gray-100 border border-dashed border-gray-300 rounded-lg flex items-center justify-center h-20 ${className}`}
      >
        <p className="text-xs text-gray-400">Google AdSense (configure publisher ID)</p>
      </div>
    )
  }

  return (
    <div ref={adRef} className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={publisherId}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive.toString()}
      />
    </div>
  )
}
