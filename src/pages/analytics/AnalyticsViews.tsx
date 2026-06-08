import { useMemo } from 'react'
import type { EChartsOption } from 'echarts'
import { analyticsApi, type AnalyticsFilters } from '../../shared/api/analytics'
import { EChart } from './EChart'
import { useAnalytics } from './useAnalytics'
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

const BASE_GRID = { left: 8, right: 16, top: 16, bottom: 56, containLabel: true }

export function StatusView({ filters }: ViewProps) {
  const { data, loading, error } = useAnalytics(() => analyticsApi.equipmentByStatus(filters), [filters])
  const rows = useMemo(() => data ?? [], [data])
  const option = useMemo<EChartsOption>(
    () => ({
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0 },
      series: [
        {
          type: 'pie',
          radius: ['45%', '72%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
          label: { show: true, formatter: '{b}\n{c}' },
          data: rows.map((r) => ({
            name: statusLabel(r.status),
            value: r.count,
            itemStyle: { color: STATUS_COLORS[r.status] },
          })),
        },
      ],
    }),
    [rows],
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
      legend: { bottom: 0 },
      grid: BASE_GRID,
      xAxis: { type: 'category', data: categories, axisLabel: { rotate: 35, interval: 0 } },
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
  }, [rows])
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
  const { data, loading, error } = useAnalytics(loader, [filters])
  const rows = useMemo(() => data ?? [], [data])
  const option = useMemo<EChartsOption>(() => {
    const sorted = [...rows].sort((a, b) => a.count - b.count)
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 8, right: 36, top: 16, bottom: 16, containLabel: true },
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: sorted.map((r) => r.label) },
      series: [
        {
          type: 'bar',
          color,
          data: sorted.map((r) => r.count),
          label: { show: true, position: 'right' },
          itemStyle: { borderRadius: [0, 4, 4, 0] },
        },
      ],
    }
  }, [rows, color])
  return (
    <ChartCard title={title} description={description} loading={loading} error={error} empty={rows.length === 0}>
      <EChart option={option} height={460} />
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
  const { data, loading, error } = useAnalytics(() => analyticsApi.ticketsTimeseries(filters), [filters])
  const rows = useMemo(() => data ?? [], [data])
  const option = useMemo<EChartsOption>(() => {
    const months = Array.from(new Set(rows.map((r) => r.month))).sort()
    const present = TICKET_STATUS_ORDER.filter((s) => rows.some((r) => r.status === s))
    const lookup = new Map<string, number>()
    for (const r of rows) lookup.set(`${r.month}|${r.status}`, r.count)
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { bottom: 0 },
      grid: { left: 8, right: 16, top: 16, bottom: 72, containLabel: true },
      dataZoom: [{ type: 'slider', bottom: 36, height: 16 }],
      xAxis: { type: 'category', data: months },
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
  }, [rows])
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
  const { data, loading, error } = useAnalytics(() => analyticsApi.ticketsByType(filters), [filters])
  const rows = useMemo(() => data ?? [], [data])
  const option = useMemo<EChartsOption>(
    () => ({
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0 },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          roseType: 'radius',
          itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
          data: rows.map((r, i) => ({
            name: ticketTypeLabel(r.label),
            value: r.count,
            itemStyle: { color: CHART_PALETTE[i % CHART_PALETTE.length] },
          })),
        },
      ],
    }),
    [rows],
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
  const { data, loading, error } = useAnalytics(() => analyticsApi.laborantLoad(filters), [filters])
  const rows = useMemo(() => data?.data ?? [], [data])
  const option = useMemo<EChartsOption>(() => {
    const names = rows.map((r) => r.username)
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { bottom: 0 },
      grid: { left: 8, right: 16, top: 16, bottom: 64, containLabel: true },
      xAxis: { type: 'category', data: names, axisLabel: { rotate: 30, interval: 0 } },
      yAxis: { type: 'value' },
      series: [
        { name: 'Выполнено', type: 'bar', color: '#2e9e6b', data: rows.map((r) => r.done_count) },
        { name: 'Отменено', type: 'bar', color: '#d2544b', data: rows.map((r) => r.cancelled_count) },
      ],
    }
  }, [rows])
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
  const { data, loading, error } = useAnalytics(() => analyticsApi.activityHeatmap(filters), [filters])
  const rows = useMemo(() => data ?? [], [data])
  const option = useMemo<EChartsOption>(() => {
    const hours = Array.from({ length: 24 }, (_, h) => `${h}:00`)
    const cells = rows.map((c) => [c.hour, c.dow, c.count])
    const max = rows.reduce((m, c) => Math.max(m, c.count), 1)
    return {
      tooltip: {
        position: 'top',
        formatter: (p: unknown) => {
          const d = (p as { data: [number, number, number] }).data
          return `${WEEKDAY_LABELS[d[1]]}, ${d[0]}:00 — ${d[2]} событий`
        },
      },
      grid: { height: '62%', top: '6%', left: 8, right: 8, containLabel: true },
      xAxis: { type: 'category', data: hours, splitArea: { show: true } },
      yAxis: { type: 'category', data: WEEKDAY_LABELS, splitArea: { show: true } },
      visualMap: {
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
  }, [rows])
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
  const { data, loading, error } = useAnalytics(() => analyticsApi.writeoffsTimeseries(filters), [filters])
  const rows = useMemo(() => data ?? [], [data])
  const option = useMemo<EChartsOption>(() => {
    const months = rows.map((r) => r.month)
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
      legend: { bottom: 0 },
      grid: { left: 8, right: 24, top: 16, bottom: 48, containLabel: true },
      xAxis: { type: 'category', data: months },
      yAxis: [
        { type: 'value', name: 'Актов' },
        { type: 'value', name: 'Единиц' },
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
  }, [rows])
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
