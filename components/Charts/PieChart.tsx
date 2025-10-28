'use client'

import { useState, useEffect } from 'react'

interface PieChartProps {
  data: Array<{
    name: string
    value: number
    color: string
  }>
}

export default function PieChart({ data }: PieChartProps) {
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null)
  const [animationProgress, setAnimationProgress] = useState(0)
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationProgress(1)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  const total = data.reduce((sum, item) => sum + item.value, 0)
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
          const gradientId = `${item.name.toLowerCase()}Gradient`
          
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
          کل پرداخت‌ها
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
          {total}%
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
          روش‌های پرداخت
        </text>
      </svg>

      {/* Modern Legend Cards */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="space-y-2">
          {data.map((item, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-300 backdrop-blur-sm ${
                hoveredSegment === index 
                  ? 'bg-white/95 dark:bg-slate-800/95 shadow-lg scale-105 border border-emerald-200/30 dark:border-emerald-700/30' 
                  : 'bg-white/80 dark:bg-slate-800/80 hover:bg-white/90 dark:hover:bg-slate-700/90 border border-emerald-100/20 dark:border-emerald-800/20'
              }`}
              onMouseEnter={() => setHoveredSegment(index)}
              onMouseLeave={() => setHoveredSegment(null)}
              onClick={() => setSelectedSegment(selectedSegment === index ? null : index)}
              style={{
                opacity: animationProgress,
                transform: `translateY(${(1 - animationProgress) * 20}px)`
              }}
            >
              <div className="flex items-center">
                <div
                  className="w-4 h-4 rounded-full ml-3 shadow-sm"
                  style={{ backgroundColor: item.color }}
                />
                <div>
                  <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    {item.name}
                  </div>
                  <div className="text-xs text-emerald-500 dark:text-emerald-400">
                    {item.value}% از کل
                  </div>
                </div>
              </div>
              <div className="text-lg font-bold text-emerald-800 dark:text-emerald-200">
                {item.value}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modern floating info */}
      <div className="absolute top-4 right-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-indigo-200/30 dark:border-indigo-700/30">
        <div className="text-xs text-indigo-500 dark:text-indigo-400 mb-1">محبوب‌ترین</div>
        <div className="text-sm font-bold text-indigo-800 dark:text-indigo-200">
          {data[0].name}
        </div>
      </div>

      <div className="absolute top-4 left-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-orange-200/30 dark:border-orange-700/30">
        <div className="text-xs text-orange-500 dark:text-orange-400 mb-1">کمترین</div>
        <div className="text-sm font-bold text-orange-800 dark:text-orange-200">
          {data[data.length - 1].name}
        </div>
      </div>
    </div>
  )
}