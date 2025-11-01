'use client'

import { useState, useEffect } from 'react'

interface PieChartProps {
  data: Array<{
    name: string
    value: number
    color: string
  }>
  title?: string
  centerLabel?: string
  centerValue?: string | number
}

export default function PieChart({ 
  data, 
  title = 'روش‌های پرداخت',
  centerLabel = 'کل پرداخت‌ها',
  centerValue 
}: PieChartProps) {
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null)
  const [animationProgress, setAnimationProgress] = useState(0)
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationProgress(1)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  // بررسی وجود داده
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
          </div>
          <p className="text-sm font-medium">هیچ داده‌ای برای نمایش وجود ندارد</p>
        </div>
      </div>
    )
  }

  const total = data.reduce((sum, item) => sum + (item.value || 0), 0)
  
  if (total === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
          </div>
          <p className="text-sm font-medium">هیچ داده‌ای برای نمایش وجود ندارد</p>
        </div>
      </div>
    )
  }
  
  let cumulativePercentage = 0

  const createPath = (percentage: number, index: number) => {
    const startAngle = (cumulativePercentage * 360) - 90
    const endAngle = ((cumulativePercentage + percentage) * 360) - 90
    
    const centerX = 120
    const centerY = 120
    const radius = hoveredSegment === index ? 70 : 65

    const startAngleRad = (startAngle * Math.PI) / 180
    const endAngleRad = (endAngle * Math.PI) / 180

    const x1 = centerX + radius * Math.cos(startAngleRad)
    const y1 = centerY + radius * Math.sin(startAngleRad)
    const x2 = centerX + radius * Math.cos(endAngleRad)
    const y2 = centerY + radius * Math.sin(endAngleRad)

    const largeArcFlag = percentage > 0.5 ? 1 : 0

    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ')

    cumulativePercentage += percentage
    return pathData
  }

  return (
    <div className="w-full h-full relative">
      {/* Modern Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/40 via-indigo-50/30 to-orange-50/30 dark:from-emerald-900/30 dark:via-indigo-900/20 dark:to-orange-900/20 rounded-2xl"></div>
      
      <svg viewBox="0 0 280 280" className="w-full h-full relative z-10">
        <defs>
          {/* Modern gradient definitions with better colors */}
          <linearGradient id="cashGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22C55E" stopOpacity="1" />
            <stop offset="100%" stopColor="#16A34A" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" stopOpacity="1" />
            <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="bankGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A855F7" stopOpacity="1" />
            <stop offset="100%" stopColor="#9333EA" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="creditGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F97316" stopOpacity="1" />
            <stop offset="100%" stopColor="#EA580C" stopOpacity="0.9" />
          </linearGradient>
          
          {/* Modern glow filter */}
          <filter id="modernGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Subtle shadow */}
          <filter id="subtleShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="rgba(0,0,0,0.1)"/>
          </filter>
        </defs>

        {/* Modern pie segments */}
        {data.map((item, index) => {
          const percentage = item.value / total
          const pathData = createPath(percentage, index)
          const gradientId = `${(item.name || `item${index}`).toLowerCase().replace(/\s+/g, '')}Gradient`
          
          return (
            <g key={index}>
              <path
                d={pathData}
                fill={`url(#${gradientId})`}
                stroke="white"
                strokeWidth="2"
                className="transition-all duration-500 cursor-pointer hover:opacity-90"
                onMouseEnter={() => setHoveredSegment(index)}
                onMouseLeave={() => setHoveredSegment(null)}
                onClick={() => setSelectedSegment(selectedSegment === index ? null : index)}
                style={{
                  opacity: animationProgress,
                  transform: `scale(${animationProgress})`,
                  transformOrigin: '120px 120px'
                }}
                filter={hoveredSegment === index ? "url(#modernGlow)" : "url(#subtleShadow)"}
              />
            </g>
          )
        })}

        {/* Modern center circle */}
        <circle
          cx="120"
          cy="120"
          r="35"
          fill="rgba(255,255,255,0.98)"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="1.5"
          className="transition-all duration-300"
          style={{
            opacity: animationProgress,
            transform: `scale(${animationProgress})`
          }}
          filter="url(#subtleShadow)"
        />

        {/* Center content */}
        <text
          x="120"
          y="115"
          textAnchor="middle"
          className="text-xs font-semibold fill-emerald-600 dark:fill-emerald-400"
          style={{
            opacity: animationProgress,
            transform: `scale(${animationProgress})`
          }}
        >
          {centerLabel}
        </text>
        <text
          x="120"
          y="130"
          textAnchor="middle"
          className="text-lg font-bold fill-slate-800 dark:fill-slate-100"
          style={{
            opacity: animationProgress,
            transform: `scale(${animationProgress})`
          }}
        >
          {centerValue !== undefined ? centerValue : `${total}%`}
        </text>

        {/* Modern title */}
        <text
          x="140"
          y="25"
          textAnchor="middle"
          className="text-base font-bold fill-indigo-700 dark:fill-indigo-300"
          style={{
            opacity: animationProgress,
            transform: `translateY(${(1 - animationProgress) * 15}px)`
          }}
        >
          {title}
        </text>
      </svg>

      {/* Modern Legend Cards */}
      <div className="absolute bottom-2 left-2 right-2 max-h-32 overflow-y-auto">
        <div className="space-y-1.5">
          {data.map((item, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all duration-300 backdrop-blur-sm ${
                hoveredSegment === index 
                  ? 'bg-white/95 dark:bg-slate-800/95 shadow-md scale-[1.02] border border-emerald-200/30 dark:border-emerald-700/30' 
                  : 'bg-white/80 dark:bg-slate-800/80 hover:bg-white/90 dark:hover:bg-slate-700/90 border border-emerald-100/20 dark:border-emerald-800/20'
              }`}
              onMouseEnter={() => setHoveredSegment(index)}
              onMouseLeave={() => setHoveredSegment(null)}
              onClick={() => setSelectedSegment(selectedSegment === index ? null : index)}
              style={{
                opacity: animationProgress,
                transform: `translateY(${(1 - animationProgress) * 10}px)`
              }}
            >
              <div className="flex items-center flex-1 min-w-0">
                <div
                  className="w-3 h-3 rounded-full ml-2 shadow-sm flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 truncate">
                    {item.name || `آیتم ${index + 1}`}
                  </div>
                  <div className="text-[10px] text-emerald-500 dark:text-emerald-400">
                    {item.value}%
                  </div>
                </div>
              </div>
              <div className="text-sm font-bold text-emerald-800 dark:text-emerald-200 flex-shrink-0 mr-2">
                {item.value}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modern floating info */}
      {data.length > 0 && (
        <>
          <div className="absolute top-2 right-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-lg p-2 shadow-md border border-indigo-200/30 dark:border-indigo-700/30">
            <div className="text-[10px] text-indigo-500 dark:text-indigo-400 mb-0.5">بیشترین</div>
            <div className="text-xs font-bold text-indigo-800 dark:text-indigo-200 truncate max-w-[80px]">
              {data[0]?.name || 'آیتم 1'}
            </div>
          </div>

          {data.length > 1 && (
            <div className="absolute top-2 left-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-lg p-2 shadow-md border border-orange-200/30 dark:border-orange-700/30">
              <div className="text-[10px] text-orange-500 dark:text-orange-400 mb-0.5">کمترین</div>
              <div className="text-xs font-bold text-orange-800 dark:text-orange-200 truncate max-w-[80px]">
                {data[data.length - 1]?.name || `آیتم ${data.length}`}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}