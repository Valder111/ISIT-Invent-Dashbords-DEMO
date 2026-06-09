import type { EChartsOption } from 'echarts'
import type { ChartLayout } from '../../shared/lib/useChartLayout'

export const BASE_GRID = { left: 8, right: 16, top: 16, bottom: 56, containLabel: true }

export function responsiveLegend(layout: ChartLayout): NonNullable<EChartsOption['legend']> {
  if (layout === 'mobile') {
    return {
      type: 'scroll',
      bottom: 0,
      left: 'center',
      width: '94%',
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 8,
      textStyle: { fontSize: 11 },
    }
  }
  if (layout === 'tablet') {
    return {
      type: 'scroll',
      bottom: 0,
      left: 'center',
      width: '96%',
      textStyle: { fontSize: 12 },
    }
  }
  return { bottom: 0 }
}

export function responsiveGrid(layout: ChartLayout, bottom = 56) {
  if (layout === 'mobile') {
    return { left: 4, right: 8, top: 12, bottom, containLabel: true }
  }
  if (layout === 'tablet') {
    return { left: 6, right: 12, top: 14, bottom, containLabel: true }
  }
  return { ...BASE_GRID, bottom }
}

type PieDatum = { name: string; value: number; itemStyle?: { color?: string } }

export function responsivePieSeries(
  layout: ChartLayout,
  data: PieDatum[],
  opts?: { rose?: boolean; inner?: string; outer?: string },
) {
  const compact = layout !== 'desktop'
  const mobile = layout === 'mobile'
  const inner = mobile ? '30%' : layout === 'tablet' ? '36%' : (opts?.inner ?? '45%')
  const outer = mobile ? '54%' : layout === 'tablet' ? '64%' : (opts?.outer ?? '72%')

  return {
    type: 'pie' as const,
    radius: opts?.rose
      ? mobile
        ? ['28%', '52%']
        : layout === 'tablet'
          ? ['34%', '62%']
          : ['40%', '70%']
      : [inner, outer],
    center: mobile ? ['50%', '42%'] : compact ? ['50%', '45%'] : ['50%', '50%'],
    roseType: opts?.rose ? ('radius' as const) : undefined,
    avoidLabelOverlap: true,
    itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
    label: { show: !compact, formatter: '{b}\n{c}', fontSize: 12 },
    labelLine: { show: !compact },
    data,
  }
}

export function responsiveChartHeight(
  layout: ChartLayout,
  desktop: number,
  opts?: { perRow?: number; rows?: number },
): number {
  if (opts?.perRow != null && opts.rows != null) {
    const rowHeight = layout === 'mobile' ? opts.perRow : layout === 'tablet' ? opts.perRow - 4 : opts.perRow - 8
    const min = layout === 'mobile' ? 300 : layout === 'tablet' ? 360 : desktop
    const calculated = Math.max(min, opts.rows * rowHeight)
    return layout === 'mobile' ? Math.min(calculated, 520) : layout === 'tablet' ? Math.min(calculated, 600) : desktop
  }
  if (layout === 'mobile') return Math.min(desktop, 300)
  if (layout === 'tablet') return Math.min(desktop, 340)
  return desktop
}

export function responsiveCategoryAxis(layout: ChartLayout, categories: string[]) {
  if (layout === 'mobile') {
    return {
      type: 'category' as const,
      data: categories,
      axisLabel: { rotate: 55, interval: 0, fontSize: 10, width: 56, overflow: 'truncate' as const },
    }
  }
  if (layout === 'tablet') {
    return {
      type: 'category' as const,
      data: categories,
      axisLabel: { rotate: 40, interval: 0, fontSize: 11 },
    }
  }
  return {
    type: 'category' as const,
    data: categories,
    axisLabel: { rotate: 35, interval: 0 },
  }
}
