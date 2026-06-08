import { http } from 'msw'
import { ok } from '../httpEnvelope'
import {
  activityHeatmap,
  consumablesStock,
  equipmentByCategoryStatus,
  equipmentByLocation,
  equipmentByStatus,
  laborantLoad,
  parseAnalyticsFilter,
  summaryKpi,
  ticketsByType,
  ticketsTimeseries,
  writeoffsTimeseries,
} from '../demoService/analytics'
import { getDb } from '../mockDb'
import { requireAuth } from './common'
import { json } from './respond'

function analyticsHandler(
  compute: (db: ReturnType<typeof getDb>, f: ReturnType<typeof parseAnalyticsFilter>) => unknown,
) {
  return ({ request }: { request: Request }) => {
    const auth = requireAuth()
    if (!auth.ok) return auth.response
    const url = new URL(request.url)
    const f = parseAnalyticsFilter(url.searchParams)
    return json(ok(compute(getDb(), f)))
  }
}

export const analyticsHandlers = [
  http.get('/api/analytics/equipment-by-status', analyticsHandler((db, f) => equipmentByStatus(db, f))),
  http.get(
    '/api/analytics/equipment-by-category-status',
    analyticsHandler((db, f) => equipmentByCategoryStatus(db, f)),
  ),
  http.get('/api/analytics/equipment-by-location', analyticsHandler((db, f) => equipmentByLocation(db, f))),
  http.get('/api/analytics/consumables-stock', analyticsHandler((db, f) => consumablesStock(db, f))),
  http.get('/api/analytics/tickets-timeseries', analyticsHandler((db, f) => ticketsTimeseries(db, f))),
  http.get('/api/analytics/tickets-by-type', analyticsHandler((db, f) => ticketsByType(db, f))),
  http.get('/api/analytics/activity-heatmap', analyticsHandler((db, f) => activityHeatmap(db, f))),
  http.get('/api/analytics/writeoffs-timeseries', analyticsHandler((db, f) => writeoffsTimeseries(db, f))),
  http.get('/api/analytics/summary-kpi', analyticsHandler((db, f) => summaryKpi(db, f))),
  http.get('/api/reports/laborant-load', ({ request }) => {
    const auth = requireAuth()
    if (!auth.ok) return auth.response
    const url = new URL(request.url)
    const f = parseAnalyticsFilter(url.searchParams)
    const rows = laborantLoad(getDb(), f)
    return json(ok({ report_type: 'laborant_workload', data: rows }))
  }),
]
