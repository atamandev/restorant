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
    }, 200)
    return () => clearTimeout(timer)
  }, [])

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white dark:bg-gray-900">
        <p className="text-gray-400 text-sm">هیچ داده‌ای برای نمایش وجود ندارد</p>
      </div>
    )
  }

  const maxValue = Math.max(...data.map(d => Math.max(d.sales || 0, d.profit || 0)))
  const minValue = Math.min(...data.map(d => Math.min(d.sales || 0, d.profit || 0)))
  const range = maxValue - minValue || 1

  const chartPadding = { top: 50, right: 60, bottom: 70, left: 70 }
  const chartWidth = 480
  const chartHeight = 380

  const getY = (value: number) => {
    return chartPadding.top + chartHeight - ((value - minValue) / range) * chartHeight
  }

  const getX = (index: number) => {
    return chartPadding.left + (index / (data.length - 1 || 1)) * chartWidth
  }

  const formatValue = (value: number) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`
    if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
    return value.toLocaleString('fa-IR')
  }

  // تشخیص نوع داده
  const isHourlyData = data.length > 0 && /^\d{1,2}:\d{2}$/.test(data[0].month)
  const getLabelStep = () => {
    if (isHourlyData && data.length > 12) return 3
    if (data.length <= 10) return 1
    if (data.length <= 20) return 2
    return Math.max(3, Math.floor(data.length / 6))
  }

  const labelStep = getLabelStep()
  const shouldShowLabel = (index: number, label: string) => {
    if (index === 0 || index === data.length - 1) return true
    if (isHourlyData) {
      const hourMatch = label.match(/^(\d{1,2}):/)
      if (hourMatch) return parseInt(hourMatch[1]) % 3 === 0
    }
    return index % labelStep === 0
  }

  // ایجاد نقاط
  const salesPoints = data.map((d, i) => ({ x: getX(i), y: getY(d.sales) }))
  const profitPoints = data.map((d, i) => ({ x: getX(i), y: getY(d.profit) }))

  // ایجاد path منحنی صاف
  const createSmoothPath = (points: Array<{x: number, y: number}>) => {
    if (points.length === 0) return ''
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
    
    let path = `M ${points[0].x} ${points[0].y}`
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i]
      const p2 = points[i + 1]
      const cp1x = p1.x + (p2.x - p1.x) / 3
      const cp1y = p1.y
      const cp2x = p2.x - (p2.x - p1.x) / 3
      const cp2y = p2.y
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
    }
    return path
  }

  return (
    <div className="w-full h-full relative bg-white dark:bg-gray-900">
      <svg viewBox="0 0 600 500" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          {/* Minimal gradient for subtle depth */}
          <linearGradient id="salesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1F2937" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#1F2937" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="profitGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4B5563" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#4B5563" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Minimal grid lines - very subtle */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <g key={ratio} style={{ opacity: animationProgress * 0.15 }}>
            <line
              x1={chartPadding.left}
              y1={chartPadding.top + (1 - ratio) * chartHeight}
              x2={chartPadding.left + chartWidth}
              y2={chartPadding.top + (1 - ratio) * chartHeight}
              stroke="#E5E7EB"
              strokeWidth="1"
              className="dark:stroke-gray-800"
            />
            <text
              x={chartPadding.left - 15}
              y={chartPadding.top + (1 - ratio) * chartHeight + 4}
              textAnchor="end"
              className="fill-gray-500 dark:fill-gray-500"
              style={{ fontSize: '11px', fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              {formatValue(maxValue - ratio * range)}
            </text>
          </g>
        ))}

        {/* Subtle area fills */}
        <path
          d={`${createSmoothPath(salesPoints)} L ${salesPoints[salesPoints.length - 1].x} ${chartPadding.top + chartHeight} L ${salesPoints[0].x} ${chartPadding.top + chartHeight} Z`}
          fill="url(#salesGradient)"
          opacity={animationProgress * 0.5}
        />
        <path
          d={`${createSmoothPath(profitPoints)} L ${profitPoints[profitPoints.length - 1].x} ${chartPadding.top + chartHeight} L ${profitPoints[0].x} ${chartPadding.top + chartHeight} Z`}
          fill="url(#profitGradient)"
          opacity={animationProgress * 0.5}
        />

        {/* Clean, minimal lines */}
        <path
          d={createSmoothPath(salesPoints)}
          fill="none"
          stroke="#1F2937"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={animationProgress}
          className="dark:stroke-gray-100"
        />

        <path
          d={createSmoothPath(profitPoints)}
          fill="none"
          stroke="#6B7280"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="5 5"
          opacity={animationProgress}
          className="dark:stroke-gray-400"
        />

        {/* Minimal data points - only visible on hover */}
        {data.map((d, i) => (
          <g key={i} style={{ opacity: animationProgress }}>
            {/* Sales point */}
            <circle
              cx={getX(i)}
              cy={getY(d.sales)}
              r={hoveredPoint === i ? "5" : "0"}
              fill="#1F2937"
              stroke="#FFFFFF"
              strokeWidth="2"
              className="dark:fill-gray-100 dark:stroke-gray-900 cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoveredPoint(i)}
              onMouseLeave={() => setHoveredPoint(null)}
            />

            {/* Profit point */}
            <circle
              cx={getX(i)}
              cy={getY(d.profit)}
              r={hoveredPoint === i ? "5" : "0"}
              fill="#6B7280"
              stroke="#FFFFFF"
              strokeWidth="2"
              className="dark:fill-gray-400 dark:stroke-gray-900 cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoveredPoint(i)}
              onMouseLeave={() => setHoveredPoint(null)}
            />

            {/* Clean X-axis labels */}
            {shouldShowLabel(i, d.month) && (
              <g>
                <line
                  x1={getX(i)}
                  y1={chartPadding.top + chartHeight}
                  x2={getX(i)}
                  y2={chartPadding.top + chartHeight + 4}
                  stroke="#D1D5DB"
                  strokeWidth="1"
                  className="dark:stroke-gray-700"
                />
                <text
                  x={getX(i)}
                  y={chartPadding.top + chartHeight + 22}
                  textAnchor="middle"
                  className="fill-gray-600 dark:fill-gray-400"
                  style={{ fontSize: '11px', fontFamily: 'system-ui, -apple-system, sans-serif' }}
                >
                  {d.month}
                </text>
              </g>
            )}

            {/* Minimal tooltip */}
            {hoveredPoint === i && (
              <g>
                <rect
                  x={getX(i) + 20}
                  y="15"
                  width="140"
                  height="70"
                  rx="8"
                  fill="#1F2937"
                  opacity="0.95"
                  className="dark:fill-gray-800"
                  style={{ filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15))' }}
                />
                <text
                  x={getX(i) + 90}
                  y="32"
                  textAnchor="middle"
                  className="fill-white dark:fill-gray-200"
                  style={{ fontSize: '12px', fontWeight: '600', fontFamily: 'system-ui, -apple-system, sans-serif' }}
                >
                  {d.month}
                </text>
                <line
                  x1={getX(i) + 30}
                  y1="38"
                  x2={getX(i) + 150}
                  y2="38"
                  stroke="#374151"
                  strokeWidth="0.5"
                  className="dark:stroke-gray-600"
                />
                <circle cx={getX(i) + 35} cy="52" r="3" fill="#1F2937" className="dark:fill-gray-200" />
                <text x={getX(i) + 45} y="55" className="fill-gray-300 dark:fill-gray-400" style={{ fontSize: '10px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>فروش:</text>
                <text x={getX(i) + 90} y="55" textAnchor="middle" className="fill-white dark:fill-gray-100" style={{ fontSize: '11px', fontWeight: '600', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  {formatValue(d.sales || 0)}
                </text>
                <circle cx={getX(i) + 35} cy="68" r="3" fill="#6B7280" className="dark:fill-gray-400" />
                <text x={getX(i) + 45} y="71" className="fill-gray-300 dark:fill-gray-400" style={{ fontSize: '10px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>سود:</text>
                <text x={getX(i) + 90} y="71" textAnchor="middle" className="fill-white dark:fill-gray-100" style={{ fontSize: '11px', fontWeight: '600', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  {formatValue(d.profit || 0)}
                </text>
              </g>
            )}
          </g>
        ))}

        {/* Minimal legend */}
        <g transform={`translate(${chartPadding.left}, 15)`} style={{ opacity: animationProgress }}>
          <g>
            <line x1="0" y1="6" x2="20" y2="6" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" className="dark:stroke-gray-100" />
            <text x="26" y="9" className="fill-gray-700 dark:fill-gray-300" style={{ fontSize: '12px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>فروش</text>
          </g>
          <g transform="translate(75, 0)">
            <line x1="0" y1="6" x2="20" y2="6" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeDasharray="5 5" className="dark:stroke-gray-400" />
            <text x="26" y="9" className="fill-gray-700 dark:fill-gray-300" style={{ fontSize: '12px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>سود</text>
          </g>
        </g>
      </svg>
    </div>
  )
}

export default memo(LineChart)
