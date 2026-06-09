import { useMemo } from 'react'
import type { EChartsOption } from 'echarts'
import { analyticsApi, type AnalyticsFilters } from '../../shared/api/analytics'
import { useChartLayout } from '../../shared/lib/useChartLayout'
import { EChart } from './EChart'
import { useAnalytics } from './useAnalytics'
import {
  responsiveCategoryAxis,
  responsiveGrid,
  responsiveLegend,
  responsivePieSeries,
} from './chartResponsive'
import {
  CHART_PALETTE,
  STATUS_COLORS,
  STATUS_ORDER,
  TICKET_STATUS_COLORS,
  TICKET_STATUS_LABELS,
  TICKET_STATUS_ORDER,
  WEEKDAY_LABELS,
  statusLabel,
  ticketTypeLabel,
} from './analyticsConfig'

export type ViewProps = {
  filters: AnalyticsFilters
  onSelectCategoryName?: (name: string) => void
}

function ChartCard({
  title,
  description,
  loading,
  error,
  empty,
  children,
}: {
  title: string
  description?: string
  loading: boolean
  error: string | null
  empty: boolean
  children: React.ReactNode
}) {
  return (
    <section className="panel analytics-chart">
      <div className="panel__header">
        <h2 className="panel__title">{title}</h2>
      </div>
      <div className="panel__body">
        {description && <p className="muted analytics-chart__desc">{description}</p>}
        {loading && <p className="muted">Загрузка данных…</p>}
        {error && <div className="alert alert--error">{error}</div>}
        {!loading && !error && empty && <p className="muted">Нет данных для выбранных фильтров.</p>}
        {!loading && !error && !empty && children}
      </div>
    </section>
  )
}

export function StatusView({ filters }: ViewProps) {
  const layout = useChartLayout()
  const { data, loading, error } = useAnalytics(() => analyticsApi.equipmentByStatus(filters), [filters])
  const rows = useMemo(() => data ?? [], [data])
  const option = useMemo<EChartsOption>(
    () => ({
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: responsiveLegend(layout),
      series: [
        responsivePieSeries(
          layout,
          rows.map((r) => ({
            name: statusLabel(r.status),
            value: r.count,
            itemStyle: { color: STATUS_COLORS[r.status] },
          })),
          { inner: '45%', outer: '72%' },
        ),
      ],
    }),
    [rows, layout],
  )
  return (
    <ChartCard
      title="Экземпляры оборудования по статусам"
      description="Распределение активного, неисправного и списанного оборудования."
      loading={loading}
      error={error}
      empty={rows.length === 0}
    >
      <EChart option={option} />
    </ChartCard>
  )
}

export function CategoryStatusView({ filters, onSelectCategoryName }: ViewProps) {
  const layout = useChartLayout()
  const { data, loading, error } = useAnalytics(
    () => analyticsApi.equipmentByCategoryStatus(filters),
    [filters],
  )
  const rows = useMemo(() => data ?? [], [data])
  const option = useMemo<EChartsOption>(() => {
    const categories = Array.from(new Set(rows.map((r) => r.category))).sort()
    const present = STATUS_ORDER.filter((s) => rows.some((r) => r.status === s))
    const lookup = new Map<string, number>()
    for (const r of rows) lookup.set(`${r.category}|${r.status}`, r.count)
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: responsiveLegend(layout),
      grid: responsiveGrid(layout, layout === 'mobile' ? 80 : 56),
      xAxis: responsiveCategoryAxis(layout, categories),
      yAxis: { type: 'value' },
      series: present.map((s) => ({
        name: statusLabel(s),
        type: 'bar',
        stack: 'total',
        color: STATUS_COLORS[s],
        emphasis: { focus: 'series' },
        data: categories.map((c) => lookup.get(`${c}|${s}`) ?? 0),
      })),
    }
  }, [rows, layout])
  return (
    <ChartCard
      title="Категории × статусы"
      description="Где сосредоточено неисправное и списанное оборудование. Клик по категории — фильтр по ней."
      loading={loading}
      error={error}
      empty={rows.length === 0}
    >
      <EChart option={option} onClick={(p) => p.name && onSelectCategoryName?.(p.name)} />
    </ChartCard>
  )
}

function HorizontalBarView({
  title,
  description,
  color,
  loader,
  filters,
}: {
  title: string
  description: string
  color: string
  loader: () => Promise<{ label: string; count: number }[]>
  filters: AnalyticsFilters
}) {
  const layout = useChartLayout()
  const { data, loading, error } = useAnalytics(loader, [filters])
  const rows = useMemo(() => data ?? [], [data])
  const sorted = useMemo(() => [...rows].sort((a, b) => a.count - b.count), [rows])
  const option = useMemo<EChartsOption>(() => {
    const compact = layout !== 'desktop'
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: responsiveGrid(layout, 16),
      xAxis: { type: 'value' },
      yAxis: {
        type: 'category',
        data: sorted.map((r) => r.label),
        axisLabel: compact
          ? { fontSize: 11, width: layout === 'mobile' ? 72 : 96, overflow: 'truncate' }
          : undefined,
      },
      series: [
        {
          type: 'bar',
          color,
          data: sorted.map((r) => r.count),
          label: { show: !compact, position: 'right', fontSize: 11 },
          itemStyle: { borderRadius: [0, 4, 4, 0] },
        },
      ],
    }
  }, [sorted, color, layout])
  return (
    <ChartCard title={title} description={description} loading={loading} error={error} empty={rows.length === 0}>
      <EChart option={option} height={460} rowCount={sorted.length} />
    </ChartCard>
  )
}

export function LocationView({ filters }: ViewProps) {
  return (
    <HorizontalBarView
      title="Экземпляры по локациям (топ-15)"
      description="Где физически размещено оборудование."
      color={CHART_PALETTE[0]}
      loader={() => analyticsApi.equipmentByLocation(filters)}
      filters={filters}
    />
  )
}

export function ConsumablesView({ filters }: ViewProps) {
  return (
    <HorizontalBarView
      title="Остатки расходников (топ-15)"
      description="Модели-расходники с наибольшим остатком на складе (поле count)."
      color={CHART_PALETTE[2]}
      loader={() => analyticsApi.consumablesStock(filters)}
      filters={filters}
    />
  )
}

export function TicketsView({ filters }: ViewProps) {
  const layout = useChartLayout()
  const { data, loading, error } = useAnalytics(() => analyticsApi.ticketsTimeseries(filters), [filters])
  const rows = useMemo(() => data ?? [], [data])
  const option = useMemo<EChartsOption>(() => {
    const months = Array.from(new Set(rows.map((r) => r.month))).sort()
    const present = TICKET_STATUS_ORDER.filter((s) => rows.some((r) => r.status === s))
    const lookup = new Map<string, number>()
    for (const r of rows) lookup.set(`${r.month}|${r.status}`, r.count)
    const mobile = layout === 'mobile'
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: responsiveLegend(layout),
      grid: responsiveGrid(layout, mobile ? 64 : 72),
      dataZoom: mobile
        ? [{ type: 'inside' }]
        : [{ type: 'slider', bottom: 36, height: 16 }],
      xAxis: {
        type: 'category',
        data: months,
        axisLabel: mobile ? { rotate: 45, fontSize: 10, interval: 0 } : undefined,
      },
      yAxis: { type: 'value' },
      series: present.map((s) => ({
        name: TICKET_STATUS_LABELS[s] ?? s,
        type: 'bar',
        stack: 'total',
        color: TICKET_STATUS_COLORS[s],
        emphasis: { focus: 'series' },
        data: months.map((m) => lookup.get(`${m}|${s}`) ?? 0),
      })),
    }
  }, [rows, layout])
  return (
    <ChartCard
      title="Динамика заявок по месяцам"
      description="Поток заявок во времени с разбивкой по статусу. Ползунок снизу — масштабирование периода."
      loading={loading}
      error={error}
      empty={rows.length === 0}
    >
      <EChart option={option} />
    </ChartCard>
  )
}

export function TicketTypesView({ filters }: ViewProps) {
  const layout = useChartLayout()
  const { data, loading, error } = useAnalytics(() => analyticsApi.ticketsByType(filters), [filters])
  const rows = useMemo(() => data ?? [], [data])
  const option = useMemo<EChartsOption>(
    () => ({
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: responsiveLegend(layout),
      series: [
        responsivePieSeries(
          layout,
          rows.map((r, i) => ({
            name: ticketTypeLabel(r.label),
            value: r.count,
            itemStyle: { color: CHART_PALETTE[i % CHART_PALETTE.length] },
          })),
          { rose: true },
        ),
      ],
    }),
    [rows, layout],
  )
  return (
    <ChartCard
      title="Заявки по типам"
      description="Соотношение ремонтных, сетевых, аппаратных и программных заявок."
      loading={loading}
      error={error}
      empty={rows.length === 0}
    >
      <EChart option={option} />
    </ChartCard>
  )
}

export function LaborantsView({ filters }: ViewProps) {
  const layout = useChartLayout()
  const { data, loading, error } = useAnalytics(() => analyticsApi.laborantLoad(filters), [filters])
  const rows = useMemo(() => data?.data ?? [], [data])
  const option = useMemo<EChartsOption>(() => {
    const names = rows.map((r) => r.username)
    const mobile = layout === 'mobile'
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: responsiveLegend(layout),
      grid: responsiveGrid(layout, mobile ? 80 : 64),
      xAxis: {
        type: 'category',
        data: names,
        axisLabel: mobile
          ? { rotate: 45, interval: 0, fontSize: 10, width: 48, overflow: 'truncate' }
          : layout === 'tablet'
            ? { rotate: 35, interval: 0, fontSize: 11 }
            : { rotate: 30, interval: 0 },
      },
      yAxis: { type: 'value' },
      series: [
        { name: 'Выполнено', type: 'bar', color: '#2e9e6b', data: rows.map((r) => r.done_count) },
        { name: 'Отменено', type: 'bar', color: '#d2544b', data: rows.map((r) => r.cancelled_count) },
      ],
    }
  }, [rows, layout])
  return (
    <ChartCard
      title="Нагрузка лаборантов"
      description="Завершённые и отменённые заявки в разрезе исполнителей."
      loading={loading}
      error={error}
      empty={rows.length === 0}
    >
      <EChart option={option} />
    </ChartCard>
  )
}

export function ActivityView({ filters }: ViewProps) {
  const layout = useChartLayout()
  const { data, loading, error } = useAnalytics(() => analyticsApi.activityHeatmap(filters), [filters])
  const rows = useMemo(() => data ?? [], [data])
  const option = useMemo<EChartsOption>(() => {
    const hours = Array.from({ length: 24 }, (_, h) => `${h}:00`)
    const cells = rows.map((c) => [c.hour, c.dow, c.count])
    const max = rows.reduce((m, c) => Math.max(m, c.count), 1)
    const mobile = layout === 'mobile'
    const tablet = layout === 'tablet'
    return {
      tooltip: {
        position: 'top',
        formatter: (p: unknown) => {
          const d = (p as { data: [number, number, number] }).data
          return `${WEEKDAY_LABELS[d[1]]}, ${d[0]}:00 — ${d[2]} событий`
        },
      },
      grid: mobile
        ? { height: '58%', top: '4%', left: 4, right: mobile ? 52 : 8, bottom: 8, containLabel: true }
        : tablet
          ? { height: '60%', top: '5%', left: 6, right: 12, containLabel: true }
          : { height: '62%', top: '6%', left: 8, right: 8, containLabel: true },
      xAxis: {
        type: 'category',
        data: hours,
        splitArea: { show: true },
        axisLabel: mobile ? { interval: 2, fontSize: 9 } : tablet ? { interval: 1, fontSize: 10 } : undefined,
      },
      yAxis: {
        type: 'category',
        data: WEEKDAY_LABELS,
        splitArea: { show: true },
        axisLabel: mobile ? { fontSize: 10 } : undefined,
      },
      visualMap: mobile
        ? {
            min: 0,
            max,
            calculable: true,
            orient: 'vertical',
            right: 4,
            top: 'center',
            itemWidth: 10,
            itemHeight: 60,
            textStyle: { fontSize: 10 },
            inRange: { color: ['#eef3f8', '#7fb0d8', '#3b82c4', '#1f3b5c'] },
          }
        : {
            min: 0,
            max,
            calculable: true,
            orient: 'horizontal',
            left: 'center',
            bottom: 4,
            inRange: { color: ['#eef3f8', '#7fb0d8', '#3b82c4', '#1f3b5c'] },
          },
      series: [
        {
          type: 'heatmap',
          data: cells,
          emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,0.3)' } },
        },
      ],
    }
  }, [rows, layout])
  return (
    <ChartCard
      title="Активность по дням недели и часам"
      description="Когда в системе фиксируется больше всего действий (журнал активности)."
      loading={loading}
      error={error}
      empty={rows.length === 0}
    >
      <EChart option={option} height={420} />
    </ChartCard>
  )
}

export function WriteoffsView({ filters }: ViewProps) {
  const layout = useChartLayout()
  const { data, loading, error } = useAnalytics(() => analyticsApi.writeoffsTimeseries(filters), [filters])
  const rows = useMemo(() => data ?? [], [data])
  const option = useMemo<EChartsOption>(() => {
    const months = rows.map((r) => r.month)
    const compact = layout !== 'desktop'
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
      legend: responsiveLegend(layout),
      grid: responsiveGrid(layout, compact ? 72 : 48),
      xAxis: {
        type: 'category',
        data: months,
        axisLabel: layout === 'mobile' ? { rotate: 45, fontSize: 10, interval: 0 } : undefined,
      },
      yAxis: [
        { type: 'value', name: compact ? '' : 'Актов', nameTextStyle: { fontSize: 11 } },
        { type: 'value', name: compact ? '' : 'Единиц', nameTextStyle: { fontSize: 11 } },
      ],
      series: [
        { name: 'Актов списания', type: 'bar', color: '#c4724b', data: rows.map((r) => r.count) },
        {
          name: 'Списано единиц',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          color: '#3b82c4',
          data: rows.map((r) => r.quantity),
        },
      ],
    }
  }, [rows, layout])
  return (
    <ChartCard
      title="Динамика списаний"
      description="Количество актов списания и списанных единиц по месяцам."
      loading={loading}
      error={error}
      empty={rows.length === 0}
    >
      <EChart option={option} />
    </ChartCard>
  )
}
