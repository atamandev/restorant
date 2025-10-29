'use client'

import { useState, useEffect } from 'react'

interface BarChartProps {
  data: Array<{
    period: string
    revenue?: number
    costOfGoodsSold?: number
    grossProfit?: number
    operatingExpenses?: number
    operatingProfit?: number
    netProfit?: number
    [key: string]: any
  }>
  categories?: string[]
  colors?: string[]
  height?: number
}

export default function BarChart({ 
  data, 
  categories = ['revenue', 'costOfGoodsSold', 'grossProfit', 'netProfit'],
  colors = ['#10B981', '#EF4444', '#3B82F6', '#8B5CF6', '#F59E0B'],
  height = 300
}: BarChartProps) {
  const [animationProgress, setAnimationProgress] = useState(0)
  const [hoveredBar, setHoveredBar] = useState<{index: number, category: string} | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationProgress(1)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-sm font-medium">هیچ داده‌ای برای نمایش وجود ندارد</p>
        </div>
      </div>
    )
  }

  // محاسبه مقادیر برای نمودار
  const allValues = data.flatMap(item => 
    categories.map(cat => {
      const value = item[cat]
      return typeof value === 'number' ? Math.abs(value) : 0
    })
  )

  const maxValue = Math.max(...allValues, 1)
  const minValue = Math.min(...allValues, 0)
  const range = maxValue - minValue || 1

  const barWidth = Math.max(35, Math.min(50, (450 / data.length) - 25))
  const categorySpacing = 8
  const groupSpacing = 25

  const formatValue = (value: number) => {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}B`
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(0)}M`
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`
    }
    return value.toLocaleString('fa-IR')
  }

  const getCategoryName = (category: string) => {
    const names: any = {
      revenue: 'درآمد',
      costOfGoodsSold: 'بهای تمام شده',
      grossProfit: 'سود ناخالص',
      operatingExpenses: 'هزینه عملیاتی',
      operatingProfit: 'سود عملیاتی',
      netProfit: 'سود خالص'
    }
    return names[category] || category
  }

  const getY = (value: number) => {
    return height - 70 - ((value - minValue) / range) * (height - 100)
  }

  const getBarHeight = (value: number) => {
    return ((value - minValue) / range) * (height - 100)
  }

  return (
    <div className="w-full h-full relative">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/40 via-transparent to-accent-50/40 dark:from-primary-900/20 dark:via-transparent dark:to-accent-900/20 rounded-xl"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent rounded-xl"></div>
      
      <svg viewBox={`0 0 550 ${height + 30}`} className="w-full h-full relative z-10">
        <defs>
          {colors.map((color, index) => (
            <linearGradient key={index} id={`barGradient${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="1" />
              <stop offset="50%" stopColor={color} stopOpacity="0.9" />
              <stop offset="100%" stopColor={color} stopOpacity="0.6" />
            </linearGradient>
          ))}
          {colors.map((color, index) => (
            <filter key={`filter${index}`} id={`glow${index}`}>
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          ))}
          <linearGradient id="gridGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
          </linearGradient>
          <pattern id="gridPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="20" fill="url(#gridGradient)" />
          </pattern>
        </defs>

        {/* Grid lines with animation */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
          <g key={index} style={{ opacity: animationProgress }}>
            <line
              x1="70"
              y1={50 + ratio * (height - 100)}
              x2="500"
              y2={50 + ratio * (height - 100)}
              stroke="url(#gridGradient)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              className="text-gray-200 dark:text-gray-700"
            />
            <text
              x="60"
              y={55 + ratio * (height - 100)}
              textAnchor="end"
              className="text-xs fill-gray-500 dark:fill-gray-400 font-semibold"
            >
              {formatValue(maxValue - ratio * range)}
            </text>
          </g>
        ))}

        {/* Bars with smooth animation */}
        {data.map((item, itemIndex) => {
          const xStart = 80 + itemIndex * (barWidth * categories.length + categorySpacing * categories.length + groupSpacing)
          
          return categories.map((category, catIndex) => {
            const value = item[category] || 0
            const x = xStart + catIndex * (barWidth + categorySpacing)
            const barHeight = getBarHeight(Math.abs(value))
            const y = getY(Math.abs(value))
            const isHovered = hoveredBar?.index === itemIndex && hoveredBar?.category === category
            const animatedHeight = barHeight * animationProgress

            return (
              <g key={`${itemIndex}-${category}`}>
                {/* Shadow effect */}
                <rect
                  x={x + 2}
                  y={y + animatedHeight + 2}
                  width={barWidth}
                  height={animatedHeight}
                  fill="rgba(0, 0, 0, 0.1)"
                  rx="6"
                  opacity={animationProgress * 0.3}
                />
                
                {/* Main bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={animatedHeight}
                  fill={`url(#barGradient${catIndex})`}
                  className="transition-all duration-300 cursor-pointer"
                  style={{
                    filter: isHovered ? `url(#glow${catIndex})` : 'none',
                    opacity: isHovered ? 1 : 0.85,
                    transform: isHovered ? 'translateY(-2px)' : 'translateY(0)'
                  }}
                  onMouseEnter={() => setHoveredBar({index: itemIndex, category})}
                  onMouseLeave={() => setHoveredBar(null)}
                  rx="6"
                />
                
                {/* Top highlight */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.min(8, animatedHeight)}
                  fill="rgba(255, 255, 255, 0.3)"
                  rx="6"
                  opacity={animationProgress}
                />

                {/* Value label on hover */}
                {isHovered && (
                  <g>
                    <rect
                      x={x + barWidth / 2 - 35}
                      y={y - 35}
                      width="70"
                      height="28"
                      fill="rgba(15, 23, 42, 0.95)"
                      rx="8"
                      className="backdrop-blur-sm"
                    />
                    <text
                      x={x + barWidth / 2}
                      y={y - 15}
                      textAnchor="middle"
                      className="text-xs fill-white font-bold"
                    >
                      {formatValue(Math.abs(value))}
                    </text>
                    <polygon
                      points={`${x + barWidth / 2},${y - 7} ${x + barWidth / 2 - 6},${y - 1} ${x + barWidth / 2 + 6},${y - 1}`}
                      fill="rgba(15, 23, 42, 0.95)"
                    />
                  </g>
                )}
              </g>
            )
          })
        })}

        {/* X-axis labels with better styling */}
        {data.map((item, index) => {
          const xStart = 80 + index * (barWidth * categories.length + categorySpacing * categories.length + groupSpacing)
          const centerX = xStart + (barWidth * categories.length + categorySpacing * (categories.length - 1)) / 2
          
          return (
            <g key={index} style={{ opacity: animationProgress }}>
              <text
                x={centerX}
                y={height - 30}
                textAnchor="middle"
                className="text-sm fill-gray-700 dark:fill-gray-200 font-semibold"
              >
                {item.period}
              </text>
            </g>
          )
        })}

        {/* Modern Legend */}
        <g transform={`translate(480, 50)`}>
          {categories.map((category, index) => (
            <g key={category} transform={`translate(0, ${index * 28})`} className="cursor-pointer">
              <rect
                width="16"
                height="16"
                fill={`url(#barGradient${index})`}
                rx="4"
                className="transition-transform hover:scale-110"
              />
              <text
                x="22"
                y="12"
                className="text-xs fill-gray-700 dark:fill-gray-200 font-medium"
              >
                {getCategoryName(category)}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  )
}

