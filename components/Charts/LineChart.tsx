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
    }, 150)
    return () => clearTimeout(timer)
  }, [])

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white dark:bg-gray-800 rounded-xl">
        <p className="text-gray-500">هیچ داده‌ای برای نمایش وجود ندارد</p>
      </div>
    )
  }

  const maxValue = Math.max(...data.map(d => Math.max(d.sales || 0, d.profit || 0)))
  const minValue = Math.min(...data.map(d => Math.min(d.sales || 0, d.profit || 0)))
  const range = maxValue - minValue || 1

  const chartPadding = { top: 50, right: 30, bottom: 70, left: 50 }
  const chartWidth = 420
  const chartHeight = 310

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

  // ایجاد path برای area
  const createAreaPath = (points: Array<{x: number, y: number}>) => {
    const linePath = createSmoothPath(points)
    const firstX = points[0].x
    const lastX = points[points.length - 1].x
    const baseY = chartPadding.top + chartHeight
    return `${linePath} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`
  }

  return (
    <div className="w-full h-full relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
      <svg viewBox="0 0 500 430" className="w-full h-full">
        <defs>
          {/* Subtle gradients */}
          <linearGradient id="salesArea" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#34D399" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#34D399" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="profitArea" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Clean grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <g key={ratio} style={{ opacity: animationProgress * 0.3 }}>
            <line
              x1={chartPadding.left}
              y1={chartPadding.top + (1 - ratio) * chartHeight}
              x2={chartPadding.left + chartWidth}
              y2={chartPadding.top + (1 - ratio) * chartHeight}
              stroke="#E5E7EB"
              strokeWidth="1"
              className="dark:stroke-gray-700"
            />
            <text
              x={chartPadding.left - 8}
              y={chartPadding.top + (1 - ratio) * chartHeight + 4}
              textAnchor="end"
              className="fill-gray-500 dark:fill-gray-400"
              style={{ fontSize: '10px' }}
            >
              {formatValue(maxValue - ratio * range)}
            </text>
          </g>
        ))}

        {/* Area fills */}
        <path
          d={createAreaPath(salesPoints)}
          fill="url(#salesArea)"
          opacity={animationProgress}
          style={{ transition: 'opacity 0.6s' }}
        />
        <path
          d={createAreaPath(profitPoints)}
          fill="url(#profitArea)"
          opacity={animationProgress}
          style={{ transition: 'opacity 0.6s' }}
        />

        {/* Sales line */}
        <path
          d={createSmoothPath(salesPoints)}
          fill="none"
          stroke="#10B981"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={animationProgress}
          style={{ transition: 'opacity 0.6s' }}
        />

        {/* Profit line */}
        <path
          d={createSmoothPath(profitPoints)}
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="6 4"
          opacity={animationProgress}
          style={{ transition: 'opacity 0.6s' }}
        />

        {/* Data points */}
        {data.map((d, i) => (
          <g key={i} style={{ opacity: animationProgress }}>
            {/* Sales point */}
            <circle
              cx={getX(i)}
              cy={getY(d.sales)}
              r={hoveredPoint === i ? "5" : "3"}
              fill="#10B981"
              stroke="white"
              strokeWidth="2"
              className="dark:stroke-gray-800 cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoveredPoint(i)}
              onMouseLeave={() => setHoveredPoint(null)}
            />

            {/* Profit point */}
            <circle
              cx={getX(i)}
              cy={getY(d.profit)}
              r={hoveredPoint === i ? "5" : "3"}
              fill="#3B82F6"
              stroke="white"
              strokeWidth="2"
              className="dark:stroke-gray-800 cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoveredPoint(i)}
              onMouseLeave={() => setHoveredPoint(null)}
            />

            {/* X-axis labels */}
            {shouldShowLabel(i, d.month) && (
              <g>
                <line
                  x1={getX(i)}
                  y1={chartPadding.top + chartHeight}
                  x2={getX(i)}
                  y2={chartPadding.top + chartHeight + 5}
                  stroke="#D1D5DB"
                  strokeWidth="1.5"
                  className="dark:stroke-gray-600"
                />
                <text
                  x={getX(i)}
                  y={chartPadding.top + chartHeight + 25}
                  textAnchor="middle"
                  className="fill-gray-600 dark:fill-gray-400"
                  style={{ fontSize: '10px' }}
                >
                  {d.month}
                </text>
              </g>
            )}

            {/* Tooltip */}
            {hoveredPoint === i && (
              <g>
                <rect
                  x={getX(i) + 20}
                  y="15"
                  width="150"
                  height="75"
                  rx="8"
                  fill="#1F2937"
                  opacity="0.95"
                  stroke="#374151"
                  strokeWidth="1"
                  className="dark:fill-gray-800 dark:stroke-gray-700"
                />
                <text
                  x={getX(i) + 95}
                  y="30"
                  textAnchor="middle"
                  className="fill-gray-200 dark:fill-gray-300"
                  style={{ fontSize: '11px', fontWeight: '600' }}
                >
                  {d.month}
                </text>
                <circle cx={getX(i) + 35} cy="48" r="3" fill="#10B981" />
                <text x={getX(i) + 45} y="51" className="fill-gray-300 dark:fill-gray-400" style={{ fontSize: '10px' }}>فروش:</text>
                <text x={getX(i) + 95} y="51" textAnchor="middle" className="fill-white dark:fill-gray-200" style={{ fontSize: '11px', fontWeight: '600' }}>
                  {formatValue(d.sales || 0)}
                </text>
                <circle cx={getX(i) + 35} cy="68" r="3" fill="#3B82F6" />
                <text x={getX(i) + 45} y="71" className="fill-gray-300 dark:fill-gray-400" style={{ fontSize: '10px' }}>سود:</text>
                <text x={getX(i) + 95} y="71" textAnchor="middle" className="fill-white dark:fill-gray-200" style={{ fontSize: '11px', fontWeight: '600' }}>
                  {formatValue(d.profit || 0)}
                </text>
                <polygon
                  points={`${getX(i) + 95},85 ${getX(i) + 88},95 ${getX(i) + 102},95`}
                  fill="#1F2937"
                  opacity="0.95"
                  className="dark:fill-gray-800"
                />
              </g>
            )}
          </g>
        ))}

        {/* Simple legend */}
        <g transform={`translate(${chartPadding.left}, 25)`} style={{ opacity: animationProgress }}>
          <g>
            <line x1="0" y1="0" x2="18" y2="0" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
            <text x="24" y="4" className="fill-gray-700 dark:fill-gray-300" style={{ fontSize: '11px' }}>فروش</text>
          </g>
          <g transform="translate(70, 0)">
            <line x1="0" y1="0" x2="18" y2="0" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 4" />
            <text x="24" y="4" className="fill-gray-700 dark:fill-gray-300" style={{ fontSize: '11px' }}>سود</text>
          </g>
        </g>
      </svg>
    </div>
  )
}

export default memo(LineChart)
