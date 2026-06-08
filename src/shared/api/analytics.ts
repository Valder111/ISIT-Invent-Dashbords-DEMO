import { apiAxios, unwrapEnvelopeData } from './axiosInstance'
import type { ResponseResponse } from './generated/data-contracts'

export type StatusCount = { status: string; count: number }
export type CategoryStatusCount = { category: string; status: string; count: number }
export type LabelCount = { label: string; count: number }
export type MonthStatusCount = { month: string; status: string; count: number }
export type MonthCount = { month: string; count: number; quantity: number }
export type HeatCell = { dow: number; hour: number; count: number }

export type KPISummary = {
  total_instances: number
  active_instances: number
  broken_instances: number
  written_off_instances: number
  open_tickets: number
  done_tickets: number
  consumable_stock: number
  models_count: number
}

export type LaborantLoadRow = {
  user_id: number
  username: string
  done_count: number
  cancelled_count: number
}

export type AnalyticsFilters = {
  from?: string
  to?: string
  category_id?: number
}

function toParams(f: AnalyticsFilters): Record<string, string> {
  const p: Record<string, string> = {}
  if (f.from) p.from = f.from
  if (f.to) p.to = f.to
  if (f.category_id) p.category_id = String(f.category_id)
  return p
}

async function get<T>(path: string, f: AnalyticsFilters): Promise<T> {
  const res = await apiAxios.get<ResponseResponse>(path, { params: toParams(f) })
  return unwrapEnvelopeData<T>(res)
}

export const analyticsApi = {
  equipmentByStatus: (f: AnalyticsFilters = {}) =>
    get<StatusCount[]>('/api/analytics/equipment-by-status', f),
  equipmentByCategoryStatus: (f: AnalyticsFilters = {}) =>
    get<CategoryStatusCount[]>('/api/analytics/equipment-by-category-status', f),
  equipmentByLocation: (f: AnalyticsFilters = {}) =>
    get<LabelCount[]>('/api/analytics/equipment-by-location', f),
  consumablesStock: (f: AnalyticsFilters = {}) =>
    get<LabelCount[]>('/api/analytics/consumables-stock', f),
  ticketsTimeseries: (f: AnalyticsFilters = {}) =>
    get<MonthStatusCount[]>('/api/analytics/tickets-timeseries', f),
  ticketsByType: (f: AnalyticsFilters = {}) =>
    get<LabelCount[]>('/api/analytics/tickets-by-type', f),
  activityHeatmap: (f: AnalyticsFilters = {}) =>
    get<HeatCell[]>('/api/analytics/activity-heatmap', f),
  writeoffsTimeseries: (f: AnalyticsFilters = {}) =>
    get<MonthCount[]>('/api/analytics/writeoffs-timeseries', f),
  summaryKpi: (f: AnalyticsFilters = {}) =>
    get<KPISummary>('/api/analytics/summary-kpi', f),
  laborantLoad: (f: AnalyticsFilters = {}) =>
    get<{ report_type?: string; data?: LaborantLoadRow[] }>('/api/reports/laborant-load', f),
}
