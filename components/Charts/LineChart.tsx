'use client'

import { useState, useEffect } from 'react'

interface LineChartProps {
  data: Array<{
    month: string
    sales: number
    profit: number
  }>
}

export default function LineChart({ data }: LineChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null)
  const [animationProgress, setAnimationProgress] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationProgress(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const maxValue = Math.max(...data.map(d => Math.max(d.sales, d.profit)))
  const minValue = Math.min(...data.map(d => Math.min(d.sales, d.profit)))
  const range = maxValue - minValue

  const getY = (value: number) => {
    return 200 - ((value - minValue) / range) * 180
  }

  const getX = (index: number) => {
    return (index / (data.length - 1)) * 400
  }

  const formatValue = (value: number) => {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}B`
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(0)}M`
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`
    }
    return value.toString()
  }

  return (
    <div className="w-full h-full relative">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/30 via-transparent to-accent-50/30 dark:from-primary-900/20 dark:via-transparent dark:to-accent-900/20 rounded-xl"></div>
      
      <svg viewBox="0 0 500 280" className="w-full h-full relative z-10">
        {/* Grid lines with gradient */}
        <defs>
          <linearGradient id="gridGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="salesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="profitGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Grid lines */}
        {[0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio, index) => (
          <g key={ratio}>
            <line
              x1="60"
              y1={40 + ratio * 200}
              x2="460"
              y2={40 + ratio * 200}
              stroke="url(#gridGradient)"
              strokeWidth="1"
              className="text-gray-200 dark:text-gray-700"
            />
            <text
              x="50"
              y={45 + ratio * 200}
              textAnchor="end"
              className="text-xs fill-gray-500 dark:fill-gray-400 font-medium"
            >
              {formatValue(maxValue - ratio * range)}
            </text>
          </g>
        ))}

        {/* Sales area fill */}
        <path
          d={`M ${60 + getX(0)},${40 + getY(data[0].sales)} ${data.map((d, i) => `L ${60 + getX(i)},${40 + getY(d.sales)}`).join(' ')} L ${60 + getX(data.length - 1)},${240} L ${60 + getX(0)},${240} Z`}
          fill="url(#salesGradient)"
          opacity={animationProgress * 0.3}
        />

        {/* Profit area fill */}
        <path
          d={`M ${60 + getX(0)},${40 + getY(data[0].profit)} ${data.map((d, i) => `L ${60 + getX(i)},${40 + getY(d.profit)}`).join(' ')} L ${60 + getX(data.length - 1)},${240} L ${60 + getX(0)},${240} Z`}
          fill="url(#profitGradient)"
          opacity={animationProgress * 0.2}
        />

        {/* Sales line */}
        <polyline
          fill="none"
          stroke="#10B981"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={`${data.length * 50} ${data.length * 50}`}
          strokeDashoffset={data.length * 50 * (1 - animationProgress)}
          points={data.map((d, i) => `${getX(i) + 60},${getY(d.sales) + 40}`).join(' ')}
          filter="url(#glow)"
        />

        {/* Profit line */}
        <polyline
          fill="none"
          stroke="#3B82F6"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={`${data.length * 50} ${data.length * 50}`}
          strokeDashoffset={data.length * 50 * (1 - animationProgress)}
          points={data.map((d, i) => `${getX(i) + 60},${getY(d.profit) + 40}`).join(' ')}
          filter="url(#glow)"
        />

        {/* Data points */}
        {data.map((d, i) => (
          <g key={i}>
            {/* Sales point */}
            <circle
              cx={getX(i) + 60}
              cy={getY(d.sales) + 40}
              r={hoveredPoint === i ? "8" : "6"}
              fill="#10B981"
              stroke="white"
              strokeWidth="3"
              className="transition-all duration-300 cursor-pointer"
              onMouseEnter={() => setHoveredPoint(i)}
              onMouseLeave={() => setHoveredPoint(null)}
              style={{
                opacity: animationProgress,
                transform: `scale(${animationProgress})`
              }}
            />
            
            {/* Profit point */}
            <circle
              cx={getX(i) + 60}
              cy={getY(d.profit) + 40}
              r={hoveredPoint === i ? "8" : "6"}
              fill="#3B82F6"
              stroke="white"
              strokeWidth="3"
              className="transition-all duration-300 cursor-pointer"
              onMouseEnter={() => setHoveredPoint(i)}
              onMouseLeave={() => setHoveredPoint(null)}
              style={{
                opacity: animationProgress,
                transform: `scale(${animationProgress})`
              }}
            />

            {/* Month labels */}
            <text
              x={getX(i) + 60}
              y="270"
              textAnchor="middle"
              className="text-xs fill-gray-600 dark:fill-gray-300 font-medium"
              style={{
                opacity: animationProgress,
                transform: `translateY(${(1 - animationProgress) * 20}px)`
              }}
            >
              {d.month}
            </text>

            {/* Hover tooltip */}
            {hoveredPoint === i && (
              <g>
                {/* Tooltip background */}
                <rect
                  x={getX(i) + 40}
                  y="10"
                  width="120"
                  height="60"
                  rx="8"
                  fill="rgba(0, 0, 0, 0.8)"
                  className="backdrop-blur-sm"
                />
                {/* Sales info */}
                <text
                  x={getX(i) + 100}
                  y="30"
                  textAnchor="middle"
                  className="text-xs fill-white font-medium"
                >
                  فروش: {d.sales.toLocaleString()} تومان
                </text>
                {/* Profit info */}
                <text
                  x={getX(i) + 100}
                  y="50"
                  textAnchor="middle"
                  className="text-xs fill-white font-medium"
                >
                  سود: {d.profit.toLocaleString()} تومان
                </text>
                {/* Tooltip arrow */}
                <polygon
                  points={`${getX(i) + 100},65 ${getX(i) + 95},75 ${getX(i) + 105},75`}
                  fill="rgba(0, 0, 0, 0.8)"
                />
              </g>
            )}
          </g>
        ))}

        {/* Legend */}
        <g transform="translate(60, 20)">
          <g className="cursor-pointer">
            <circle cx="0" cy="0" r="4" fill="#10B981" />
            <text x="12" y="4" className="text-sm fill-gray-700 dark:fill-gray-200 font-medium">فروش</text>
          </g>
          <g className="cursor-pointer" transform="translate(80, 0)">
            <circle cx="0" cy="0" r="4" fill="#3B82F6" />
            <text x="12" y="4" className="text-sm fill-gray-700 dark:fill-gray-200 font-medium">سود</text>
          </g>
        </g>

        {/* Chart title */}
        <text
          x="250"
          y="20"
          textAnchor="middle"
          className="text-lg fill-gray-800 dark:fill-gray-100 font-bold"
        >
          روند فروش و سود سالانه
        </text>
      </svg>

      {/* Floating stats */}
      <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">بیشترین فروش</div>
        <div className="text-sm font-bold text-gray-800 dark:text-gray-100">
          {Math.max(...data.map(d => d.sales)).toLocaleString()} تومان
        </div>
      </div>

      <div className="absolute top-4 left-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">بیشترین سود</div>
        <div className="text-sm font-bold text-gray-800 dark:text-gray-100">
          {Math.max(...data.map(d => d.profit)).toLocaleString()} تومان
        </div>
      </div>
    </div>
  )
}