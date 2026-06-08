import type {
  CategoryStatusCount,
  HeatCell,
  KPISummary,
  LabelCount,
  MonthCount,
  MonthStatusCount,
  StatusCount,
} from '../../shared/api/analytics'
import type { DemoDb } from '../mockDb'

export type AnalyticsFilter = {
  from?: string
  to?: string
  category_id?: number
}

function parseDate(s?: string): Date | null {
  if (!s?.trim()) return null
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}

function inRange(createdAt: string, from: Date | null, to: Date | null): boolean {
  const t = new Date(createdAt).getTime()
  if (from && t < from.getTime()) return false
  if (to && t > to.getTime()) return false
  return true
}

function filterInstances(db: DemoDb, f: AnalyticsFilter) {
  const from = parseDate(f.from)
  const to = parseDate(f.to)
  return db.instances.filter((i) => {
    if (!i.is_active) return false
    if (f.category_id != null) {
      const model = db.models.find((m) => m.id === i.model_id)
      if (!model || model.type_id !== f.category_id) return false
    }
    return inRange(i.created_at, from, to)
  })
}

function filterTickets(db: DemoDb, f: AnalyticsFilter) {
  const from = parseDate(f.from)
  const to = parseDate(f.to)
  return db.tickets.filter((t) => t.is_active && inRange(t.created_at, from, to))
}

function filterActivity(db: DemoDb, f: AnalyticsFilter) {
  const from = parseDate(f.from)
  const to = parseDate(f.to)
  return db.activity.filter((a) => inRange(a.created_at, from, to))
}

function filterWriteoffs(db: DemoDb, f: AnalyticsFilter) {
  const from = parseDate(f.from)
  const to = parseDate(f.to)
  return db.writeoffs.filter((w) => inRange(w.created_at, from, to))
}

function monthKey(iso: string): string {
  const d = new Date(iso)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function equipmentByStatus(db: DemoDb, f: AnalyticsFilter): StatusCount[] {
  const map = new Map<string, number>()
  for (const i of filterInstances(db, f)) {
    map.set(i.status, (map.get(i.status) ?? 0) + 1)
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([status, count]) => ({ status, count }))
}

export function equipmentByCategoryStatus(db: DemoDb, f: AnalyticsFilter): CategoryStatusCount[] {
  const map = new Map<string, number>()
  for (const i of filterInstances(db, f)) {
    const model = db.models.find((m) => m.id === i.model_id)
    const cat = model ? db.types.find((t) => t.id === model.type_id) : undefined
    const key = `${cat?.name ?? '—'}\0${i.status}`
    map.set(key, (map.get(key) ?? 0) + 1)
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, count]) => {
      const [category, status] = k.split('\0')
      return { category, status, count }
    })
}

export function equipmentByLocation(db: DemoDb, f: AnalyticsFilter): LabelCount[] {
  const map = new Map<string, number>()
  for (const i of filterInstances(db, f)) {
    const loc = i.location_id != null ? db.locations.find((l) => l.id === i.location_id) : undefined
    const label = loc?.name ?? '—'
    map.set(label, (map.get(label) ?? 0) + 1)
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([label, count]) => ({ label, count }))
}

export function consumablesStock(db: DemoDb, f: AnalyticsFilter): LabelCount[] {
  let models = db.models.filter((m) => m.is_consumable && m.is_active)
  if (f.category_id != null) models = models.filter((m) => m.type_id === f.category_id)
  return models
    .map((m) => ({ label: m.name, count: m.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)
}

export function ticketsTimeseries(db: DemoDb, f: AnalyticsFilter): MonthStatusCount[] {
  const map = new Map<string, number>()
  for (const t of filterTickets(db, f)) {
    const key = `${monthKey(t.created_at)}\0${t.status}`
    map.set(key, (map.get(key) ?? 0) + 1)
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, count]) => {
      const [month, status] = k.split('\0')
      return { month, status, count }
    })
}

export function ticketsByType(db: DemoDb, f: AnalyticsFilter): LabelCount[] {
  const map = new Map<string, number>()
  for (const t of filterTickets(db, f)) {
    map.set(t.type, (map.get(t.type) ?? 0) + 1)
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count }))
}

export function activityHeatmap(db: DemoDb, f: AnalyticsFilter): HeatCell[] {
  const map = new Map<string, number>()
  for (const a of filterActivity(db, f)) {
    const d = new Date(a.created_at)
    const dow = d.getUTCDay()
    const hour = d.getUTCHours()
    const key = `${dow}\0${hour}`
    map.set(key, (map.get(key) ?? 0) + 1)
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
    .map(([k, count]) => {
      const [dow, hour] = k.split('\0').map(Number)
      return { dow, hour, count }
    })
}

export function writeoffsTimeseries(db: DemoDb, f: AnalyticsFilter): MonthCount[] {
  const byMonth = new Map<string, { count: number; quantity: number }>()
  for (const w of filterWriteoffs(db, f)) {
    const month = monthKey(w.created_at)
    const cur = byMonth.get(month) ?? { count: 0, quantity: 0 }
    cur.count += 1
    cur.quantity += w.quantity ?? 0
    byMonth.set(month, cur)
  }
  return [...byMonth.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, v]) => ({ month, count: v.count, quantity: v.quantity }))
}

export function summaryKpi(db: DemoDb, f: AnalyticsFilter): KPISummary {
  const instances = filterInstances(db, f)
  const tickets = filterTickets(db, f)
  const kpi: KPISummary = {
    total_instances: 0,
    active_instances: 0,
    broken_instances: 0,
    written_off_instances: 0,
    open_tickets: 0,
    done_tickets: 0,
    consumable_stock: 0,
    models_count: 0,
  }
  for (const i of instances) {
    kpi.total_instances += 1
    if (i.status === 'active') kpi.active_instances += 1
    else if (i.status === 'broken') kpi.broken_instances += 1
    else if (i.status === 'written_off') kpi.written_off_instances += 1
  }
  for (const t of tickets) {
    if (t.status === 'draft' || t.status === 'in_progress') kpi.open_tickets += 1
    if (t.status === 'done') kpi.done_tickets += 1
  }
  let consumables = db.models.filter((m) => m.is_consumable && m.is_active)
  let activeModels = db.models.filter((m) => m.is_active)
  if (f.category_id != null) {
    consumables = consumables.filter((m) => m.type_id === f.category_id)
    activeModels = activeModels.filter((m) => m.type_id === f.category_id)
  }
  kpi.consumable_stock = consumables.reduce((s, m) => s + m.count, 0)
  kpi.models_count = activeModels.length
  return kpi
}

export type LaborantLoadRow = {
  user_id: number
  username: string
  done_count: number
  cancelled_count: number
}

export function laborantLoad(db: DemoDb, _f: AnalyticsFilter): LaborantLoadRow[] {
  const map = new Map<number, { done: number; cancelled: number }>()
  for (const t of db.tickets) {
    if (!t.is_active || t.laborant_id == null) continue
    const u = db.users.find((x) => x.id === t.laborant_id)
    if (!u || (u.role !== 'laborant' && u.role !== 'admin')) continue
    const cur = map.get(t.laborant_id) ?? { done: 0, cancelled: 0 }
    if (t.status === 'done') cur.done += 1
    if (t.status === 'cancelled') cur.cancelled += 1
    map.set(t.laborant_id, cur)
  }
  return [...map.entries()]
    .map(([user_id, c]) => {
      const u = db.users.find((x) => x.id === user_id)
      return {
        user_id,
        username: u?.username ?? 'Лаборант',
        done_count: c.done,
        cancelled_count: c.cancelled,
      }
    })
    .sort((a, b) => b.done_count - a.done_count)
}

export function parseAnalyticsFilter(params: URLSearchParams): AnalyticsFilter {
  const f: AnalyticsFilter = {}
  const from = params.get('from')
  const to = params.get('to')
  const category = params.get('category_id')
  if (from) f.from = from
  if (to) f.to = to
  if (category) {
    const n = Number(category)
    if (Number.isFinite(n)) f.category_id = n
  }
  return f
}
