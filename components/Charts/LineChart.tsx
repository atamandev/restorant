'use client'

import { useState, useEffect, memo } from 'react'

interface LineChartProps {
  data: Array<{
    month: string
    sales: number
    profit: number
  }>
  showAllLabels?: boolean
}

function LineChart({ data, showAllLabels = false }: LineChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null)
  const [animationProgress, setAnimationProgress] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationProgress(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // بررسی وجود داده
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <p className="text-sm font-medium">هیچ داده‌ای برای نمایش وجود ندارد</p>
        </div>
      </div>
    )
  }

  const maxValue = Math.max(...data.map(d => Math.max(d.sales || 0, d.profit || 0)))
  const minValue = Math.min(...data.map(d => Math.min(d.sales || 0, d.profit || 0)))
  const range = maxValue - minValue || 1

  const getY = (value: number) => {
    return 220 - ((value - minValue) / range) * 200
  }

  const getX = (index: number) => {
    return (index / (data.length - 1 || 1)) * 420
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
      {/* Background with multiple gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/40 via-transparent to-accent-50/40 dark:from-primary-900/20 dark:via-transparent dark:to-accent-900/20 rounded-xl"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent rounded-xl"></div>
      
      <svg viewBox="0 0 500 340" className="w-full h-full relative z-10" style={{ overflow: 'visible' }}>
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

        {/* Grid lines with animation */}
        {[0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio, index) => (
          <g key={ratio} style={{ opacity: animationProgress }}>
            <line
              x1="70"
              y1={50 + ratio * 200}
              x2="470"
              y2={50 + ratio * 200}
              stroke="url(#gridGradient)"
              strokeWidth="1.5"
              strokeDasharray="5 5"
              className="text-gray-200 dark:text-gray-700"
            />
            <text
              x="60"
              y={55 + ratio * 200}
              textAnchor="end"
              className="text-xs fill-gray-500 dark:fill-gray-400 font-semibold"
            >
              {formatValue(maxValue - ratio * range)}
            </text>
          </g>
        ))}

        {/* Sales area fill with smooth curve */}
        <path
          d={`M ${70 + getX(0)},${50 + getY(data[0].sales)} ${data.map((d, i) => `L ${70 + getX(i)},${50 + getY(d.sales)}`).join(' ')} L ${70 + getX(data.length - 1)},${250} L ${70 + getX(0)},${250} Z`}
          fill="url(#salesGradient)"
          opacity={animationProgress * 0.35}
          className="transition-opacity duration-1000"
        />

        {/* Profit area fill with smooth curve */}
        <path
          d={`M ${70 + getX(0)},${50 + getY(data[0].profit)} ${data.map((d, i) => `L ${70 + getX(i)},${50 + getY(d.profit)}`).join(' ')} L ${70 + getX(data.length - 1)},${250} L ${70 + getX(0)},${250} Z`}
          fill="url(#profitGradient)"
          opacity={animationProgress * 0.25}
          className="transition-opacity duration-1000"
        />

        {/* Sales line with glow effect */}
        <polyline
          fill="none"
          stroke="#10B981"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={`${data.length * 60} ${data.length * 60}`}
          strokeDashoffset={data.length * 60 * (1 - animationProgress)}
          points={data.map((d, i) => `${getX(i) + 70},${getY(d.sales) + 50}`).join(' ')}
          filter="url(#glow)"
          className="transition-all duration-1000"
        />

        {/* Profit line with glow effect */}
        <polyline
          fill="none"
          stroke="#3B82F6"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={`${data.length * 60} ${data.length * 60}`}
          strokeDashoffset={data.length * 60 * (1 - animationProgress)}
          points={data.map((d, i) => `${getX(i) + 70},${getY(d.profit) + 50}`).join(' ')}
          filter="url(#glow)"
          className="transition-all duration-1000"
        />

        {/* Data points with modern styling */}
        {data.map((d, i) => (
          <g key={i} style={{ opacity: animationProgress }}>
            {/* Sales point with glow */}
            <circle
              cx={getX(i) + 70}
              cy={getY(d.sales) + 50}
              r={hoveredPoint === i ? "10" : "7"}
              fill="#10B981"
              stroke="white"
              strokeWidth="3"
              className="transition-all duration-300 cursor-pointer"
              onMouseEnter={() => setHoveredPoint(i)}
              onMouseLeave={() => setHoveredPoint(null)}
              style={{
                filter: hoveredPoint === i ? 'url(#glow)' : 'none',
                transform: `scale(${animationProgress})`,
                transition: 'all 0.3s ease'
              }}
            />
            {/* Outer glow ring */}
            <circle
              cx={getX(i) + 70}
              cy={getY(d.sales) + 50}
              r={hoveredPoint === i ? "14" : "10"}
              fill="none"
              stroke="#10B981"
              strokeWidth="2"
              opacity={hoveredPoint === i ? 0.4 : 0.2}
              className="transition-all duration-300"
            />
            
            {/* Profit point with glow */}
            <circle
              cx={getX(i) + 70}
              cy={getY(d.profit) + 50}
              r={hoveredPoint === i ? "10" : "7"}
              fill="#3B82F6"
              stroke="white"
              strokeWidth="3"
              className="transition-all duration-300 cursor-pointer"
              onMouseEnter={() => setHoveredPoint(i)}
              onMouseLeave={() => setHoveredPoint(null)}
              style={{
                filter: hoveredPoint === i ? 'url(#glow)' : 'none',
                transform: `scale(${animationProgress})`,
                transition: 'all 0.3s ease'
              }}
            />
            {/* Outer glow ring */}
            <circle
              cx={getX(i) + 70}
              cy={getY(d.profit) + 50}
              r={hoveredPoint === i ? "14" : "10"}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2"
              opacity={hoveredPoint === i ? 0.4 : 0.2}
              className="transition-all duration-300"
            />

            {/* Month labels - با فاصله‌گذاری هوشمند و مدرن */}
            {(() => {
              // تشخیص اینکه آیا برچسب ساعتی است (مثل "1:00", "12:00")
              const isHourlyLabel = /^\d{1,2}:\d{2}$/.test(d.month)
              
              // تشخیص اینکه آیا برچسب روزانه است (مثل "1 فروردین", "15 شهریور")
              const isDailyLabel = /\d+\s+(فروردین|اردیبهشت|خرداد|تیر|مرداد|شهریور|مهر|آبان|آذر|دی|بهمن|اسفند)/.test(d.month) || 
                                  /^\d+$/.test(d.month.trim()) // فقط عدد (روز ماه)
              
              // برای برچسب‌های ساعتی با داده‌های زیاد (24 ساعت)، فقط هر 3 ساعت یک بار نمایش بده
              if (isHourlyLabel && data.length > 12) {
                const hourValue = parseInt(d.month.split(':')[0])
                const shouldShow = hourValue % 3 === 0 || i === 0 || i === data.length - 1
                
                if (!shouldShow) return null
                
                return (
                  <g>
                    <line
                      x1={getX(i) + 70}
                      y1="50"
                      x2={getX(i) + 70}
                      y2="250"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      strokeDasharray="3 3"
                      opacity="0.15"
                      className="text-gray-400 dark:text-gray-600"
                    />
                    <circle
                      cx={getX(i) + 70}
                      cy="250"
                      r="3"
                      fill="currentColor"
                      opacity="0.4"
                      className="text-gray-500 dark:text-gray-400"
                    />
                    <text
                      x={getX(i) + 70}
                      y="325"
                      textAnchor="middle"
                      className="text-xs fill-gray-700 dark:fill-gray-200 font-semibold"
                      style={{
                        transform: `translateY(${(1 - animationProgress) * 20}px)`,
                        letterSpacing: '0.5px',
                        fontWeight: '600'
                      }}
                    >
                      {d.month}
                    </text>
                  </g>
                )
              }
              
              // برای برچسب‌های روزانه با داده‌های زیاد (بیش از 15 روز)، فقط هر 5 روز یک بار نمایش بده
              if (isDailyLabel && data.length > 15) {
                // استخراج عدد روز از برچسب
                const dayMatch = d.month.match(/^(\d+)/)
                const dayValue = dayMatch ? parseInt(dayMatch[1]) : i + 1
                
                // نمایش: 1, 5, 10, 15, 20, 25, 30 و همچنین اولین و آخرین
                const shouldShow = dayValue % 5 === 0 || dayValue === 1 || i === 0 || i === data.length - 1
                
                if (!shouldShow) return null
                
                return (
                  <g>
                    <line
                      x1={getX(i) + 70}
                      y1="50"
                      x2={getX(i) + 70}
                      y2="250"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      strokeDasharray="3 3"
                      opacity="0.15"
                      className="text-gray-400 dark:text-gray-600"
                    />
                    <circle
                      cx={getX(i) + 70}
                      cy="250"
                      r="3"
                      fill="currentColor"
                      opacity="0.4"
                      className="text-gray-500 dark:text-gray-400"
                    />
                    <text
                      x={getX(i) + 70}
                      y="325"
                      textAnchor="middle"
                      className="text-xs fill-gray-700 dark:fill-gray-200 font-semibold"
                      style={{
                        transform: `translateY(${(1 - animationProgress) * 20}px)`,
                        letterSpacing: '0.5px',
                        fontWeight: '600'
                      }}
                    >
                      {d.month}
                    </text>
                  </g>
                )
              }
              
              // برای برچسب‌های ماهانه یا داده‌های کم (کمتر از 15)
              if (showAllLabels || data.length <= 15) {
                return (
                  <g>
                    <line
                      x1={getX(i) + 70}
                      y1="50"
                      x2={getX(i) + 70}
                      y2="250"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      strokeDasharray="3 3"
                      opacity="0.15"
                      className="text-gray-400 dark:text-gray-600"
                    />
                    <circle
                      cx={getX(i) + 70}
                      cy="250"
                      r="3"
                      fill="currentColor"
                      opacity="0.4"
                      className="text-gray-500 dark:text-gray-400"
                    />
                    <text
                      x={getX(i) + 70}
                      y="325"
                      textAnchor="middle"
                      className="text-xs fill-gray-700 dark:fill-gray-200 font-semibold"
                      style={{
                        transform: `translateY(${(1 - animationProgress) * 20}px)`,
                        letterSpacing: '0.5px',
                        fontWeight: '600'
                      }}
                    >
                      {d.month}
                    </text>
                  </g>
                )
              }
              
              // برای سایر داده‌های زیاد، هر N ام را نمایش بده (حداکثر 12 برچسب)
              const maxLabels = 12
              const step = Math.max(1, Math.floor(data.length / maxLabels))
              if (i % step === 0 || i === 0 || i === data.length - 1) {
                return (
                  <g>
                    <line
                      x1={getX(i) + 70}
                      y1="50"
                      x2={getX(i) + 70}
                      y2="250"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      strokeDasharray="3 3"
                      opacity="0.15"
                      className="text-gray-400 dark:text-gray-600"
                    />
                    <circle
                      cx={getX(i) + 70}
                      cy="250"
                      r="3"
                      fill="currentColor"
                      opacity="0.4"
                      className="text-gray-500 dark:text-gray-400"
                    />
                    <text
                      x={getX(i) + 70}
                      y="325"
                      textAnchor="middle"
                      className="text-xs fill-gray-700 dark:fill-gray-200 font-semibold"
                      style={{
                        transform: `translateY(${(1 - animationProgress) * 20}px)`,
                        letterSpacing: '0.5px',
                        fontWeight: '600'
                      }}
                    >
                      {d.month}
                    </text>
                  </g>
                )
              }
              
              return null
            })()}

            {/* Modern hover tooltip */}
            {hoveredPoint === i && (
              <g>
                {/* Tooltip background with blur */}
                <rect
                  x={getX(i) + 20}
                  y="15"
                  width="140"
                  height="70"
                  rx="12"
                  fill="rgba(15, 23, 42, 0.95)"
                  className="backdrop-blur-md"
                />
                {/* Sales info */}
                <circle cx={getX(i) + 40} cy="35" r="4" fill="#10B981" />
                <text
                  x={getX(i) + 50}
                  y="38"
                  className="text-xs fill-gray-300 font-medium"
                >
                  فروش
                </text>
                <text
                  x={getX(i) + 90}
                  y="38"
                  textAnchor="middle"
                  className="text-xs fill-white font-bold"
                >
                  {formatValue(d.sales || 0)}
                </text>
                {/* Profit info */}
                <circle cx={getX(i) + 40} cy="55" r="4" fill="#3B82F6" />
                <text
                  x={getX(i) + 50}
                  y="58"
                  className="text-xs fill-gray-300 font-medium"
                >
                  سود
                </text>
                <text
                  x={getX(i) + 90}
                  y="58"
                  textAnchor="middle"
                  className="text-xs fill-white font-bold"
                >
                  {formatValue(d.profit || 0)}
                </text>
                {/* Tooltip arrow */}
                <polygon
                  points={`${getX(i) + 90},80 ${getX(i) + 85},90 ${getX(i) + 95},90`}
                  fill="rgba(15, 23, 42, 0.95)"
                />
              </g>
            )}
          </g>
        ))}

        {/* Modern Legend */}
        <g transform="translate(70, 25)" style={{ opacity: animationProgress }}>
          <g className="cursor-pointer transition-transform hover:scale-110">
            <circle cx="0" cy="0" r="5" fill="#10B981" />
            <circle cx="0" cy="0" r="8" fill="none" stroke="#10B981" strokeWidth="2" opacity="0.3" />
            <text x="15" y="4" className="text-sm fill-gray-700 dark:fill-gray-200 font-semibold">فروش</text>
          </g>
          <g className="cursor-pointer transition-transform hover:scale-110" transform="translate(100, 0)">
            <circle cx="0" cy="0" r="5" fill="#3B82F6" />
            <circle cx="0" cy="0" r="8" fill="none" stroke="#3B82F6" strokeWidth="2" opacity="0.3" />
            <text x="15" y="4" className="text-sm fill-gray-700 dark:fill-gray-200 font-semibold">سود</text>
          </g>
        </g>
      </svg>

      {/* Floating stats */}
      {data.length > 0 && (
        <>
          <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">بیشترین فروش</div>
            <div className="text-sm font-bold text-gray-800 dark:text-gray-100">
              {Math.max(...data.map(d => d.sales || 0)).toLocaleString()} تومان
            </div>
          </div>

          <div className="absolute top-4 left-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">بیشترین سود</div>
            <div className="text-sm font-bold text-gray-800 dark:text-gray-100">
              {Math.max(...data.map(d => d.profit || 0)).toLocaleString()} تومان
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default memo(LineChart)