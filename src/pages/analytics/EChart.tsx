import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

export type EChartClickHandler = (params: { name?: string; value?: unknown; seriesName?: string }) => void

export function EChart({
  option,
  height = 380,
  onClick,
}: {
  option: EChartsOption
  height?: number
  onClick?: EChartClickHandler
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)
  const clickRef = useRef<EChartClickHandler | undefined>(onClick)
  clickRef.current = onClick

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const chart = echarts.init(el, undefined, { renderer: 'canvas' })
    chartRef.current = chart
    chart.on('click', (params) => {
      clickRef.current?.({
        name: (params as { name?: string }).name,
        value: (params as { value?: unknown }).value,
        seriesName: (params as { seriesName?: string }).seriesName,
      })
    })
    const ro = new ResizeObserver(() => chart.resize())
    ro.observe(el)
    return () => {
      ro.disconnect()
      chart.dispose()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    chartRef.current?.setOption(option, true)
  }, [option])

  return <div ref={containerRef} style={{ width: '100%', height }} />
}
