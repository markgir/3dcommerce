'use client'

interface AdBannerProps {
  placement?: 'header' | 'sidebar' | 'inline' | 'footer'
  className?: string
}

export default function AdBanner({ placement = 'inline', className = '' }: AdBannerProps) {
  const sizeMap = {
    header: 'h-24 md:h-20',
    sidebar: 'h-64',
    inline: 'h-24',
    footer: 'h-20',
  }

  return (
    <div
      className={`bg-gray-100 border border-dashed border-gray-300 rounded-lg flex items-center justify-center ${sizeMap[placement]} ${className}`}
    >
      <div className="text-center">
        <p className="text-xs text-gray-400 font-medium">Advertisement</p>
        <p className="text-xs text-gray-300">
          {placement === 'sidebar' ? '160×600' : placement === 'header' ? '728×90' : '468×60'}
        </p>
      </div>
    </div>
  )
}
