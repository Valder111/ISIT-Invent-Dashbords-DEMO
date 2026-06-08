import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { analyticsApi, type AnalyticsFilters } from '../../shared/api/analytics'
import { typesApi, type EquipmentCategory } from '../../shared/api/equipment'
import { useAnalytics } from './useAnalytics'
import {
  ActivityView,
  CategoryStatusView,
  ConsumablesView,
  LaborantsView,
  LocationView,
  StatusView,
  TicketsView,
  TicketTypesView,
  WriteoffsView,
  type ViewProps,
} from './AnalyticsViews'
import '../../css/panel.css'
import '../../css/main-page.css'
import '../../css/analytics-page.css'

type TabId =
  | 'status'
  | 'category'
  | 'location'
  | 'consumables'
  | 'tickets'
  | 'types'
  | 'laborants'
  | 'activity'
  | 'writeoffs'

const TABS: { id: TabId; label: string; Component: (p: ViewProps) => React.ReactElement }[] = [
  { id: 'status', label: 'Статусы', Component: StatusView },
  { id: 'category', label: 'Категории', Component: CategoryStatusView },
  { id: 'location', label: 'Локации', Component: LocationView },
  { id: 'consumables', label: 'Расходники', Component: ConsumablesView },
  { id: 'tickets', label: 'Заявки', Component: TicketsView },
  { id: 'types', label: 'Типы заявок', Component: TicketTypesView },
  { id: 'laborants', label: 'Лаборанты', Component: LaborantsView },
  { id: 'activity', label: 'Активность', Component: ActivityView },
  { id: 'writeoffs', label: 'Списания', Component: WriteoffsView },
]

const EMPTY_DRAFT = { from: '', to: '', category_id: '' }

function KpiPanel({ filters }: { filters: AnalyticsFilters }) {
  const { data, loading, error } = useAnalytics(() => analyticsApi.summaryKpi(filters), [filters])

  if (loading) return <p className="muted">Загрузка показателей…</p>
  if (error) return <div className="alert alert--error">{error}</div>
  if (!data) return null

  const operable = data.active_instances + data.broken_instances
  const brokenPct = operable > 0 ? Math.round((data.broken_instances / operable) * 100) : 0

  const tiles = [
    { value: data.total_instances, label: 'Экземпляров всего' },
    { value: `${brokenPct}%`, label: 'Доля неисправных' },
    { value: data.written_off_instances, label: 'Списано' },
    { value: data.open_tickets, label: 'Открытые заявки' },
    { value: data.done_tickets, label: 'Выполнено заявок' },
    { value: data.consumable_stock, label: 'Остаток расходников' },
  ]

  return (
    <div className="main-stats-grid main-stats-grid--count-3 analytics-kpi-grid">
      {tiles.map((t) => (
        <div className="stat-card" key={t.label}>
          <div className="stat-card__value">{t.value}</div>
          <div className="stat-card__label">{t.label}</div>
        </div>
      ))}
    </div>
  )
}

export function AnalyticsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const viewParam = searchParams.get('view') as TabId | null
  const activeTab = TABS.find((t) => t.id === viewParam) ?? TABS[0]

  const [categories, setCategories] = useState<EquipmentCategory[]>([])
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [applied, setApplied] = useState<AnalyticsFilters>({})

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const cats = await typesApi.list()
        if (!cancelled) {
          setCategories(cats)
        }
      } catch {
        /* фильтры остаются пустыми — графики всё равно строятся */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  function setView(id: TabId) {
    const next = new URLSearchParams(searchParams)
    next.set('view', id)
    setSearchParams(next, { replace: true })
  }

  function buildFilters(d: typeof EMPTY_DRAFT): AnalyticsFilters {
    const f: AnalyticsFilters = {}
    if (d.from) f.from = d.from
    if (d.to) f.to = d.to
    if (d.category_id) f.category_id = Number(d.category_id)
    return f
  }

  function applyFilters() {
    setApplied(buildFilters(draft))
  }

  function resetFilters() {
    setDraft(EMPTY_DRAFT)
    setApplied({})
  }

  function selectCategoryByName(name: string) {
    const cat = categories.find((c) => c.name === name)
    if (!cat) return
    const nextDraft = { ...draft, category_id: String(cat.id) }
    setDraft(nextDraft)
    setApplied(buildFilters(nextDraft))
  }

  const ActiveComponent = activeTab.Component
  const viewProps = useMemo<ViewProps>(
    () => ({ filters: applied, onSelectCategoryName: selectCategoryByName }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [applied, categories],
  )

  return (
    <div className="analytics-page">
      <h1 className="page-title">Отчётность и статистика</h1>
      <p className="muted analytics-page__lead">
        Интерактивные срезы данных системы инвентаризации: оборудование, заявки, списания и активность.
        Используйте фильтры периода и категории — графики обновятся после нажатия «Применить».
      </p>

      <nav className="analytics-tabs" aria-label="Разделы аналитики">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`analytics-tabs__btn${t.id === activeTab.id ? ' analytics-tabs__btn--active' : ''}`}
            onClick={() => setView(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <section className="panel analytics-filters">
        <div className="panel__body analytics-filters__body">
          <label className="analytics-filters__field">
            <span className="analytics-filters__label">Период с</span>
            <input
              type="date"
              className="input"
              value={draft.from}
              onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
            />
          </label>
          <label className="analytics-filters__field">
            <span className="analytics-filters__label">по</span>
            <input
              type="date"
              className="input"
              value={draft.to}
              onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
            />
          </label>
          <label className="analytics-filters__field">
            <span className="analytics-filters__label">Категория</span>
            <select
              className="input"
              value={draft.category_id}
              onChange={(e) => setDraft((d) => ({ ...d, category_id: e.target.value }))}
            >
              <option value="">Все категории</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <div className="analytics-filters__actions">
            <button type="button" className="btn btn--primary btn--sm" onClick={applyFilters}>
              Применить
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={resetFilters}>
              Сбросить
            </button>
          </div>
        </div>
      </section>

      <section className="panel analytics-kpi">
        <div className="panel__header">
          <h2 className="panel__title">Ключевые показатели</h2>
        </div>
        <div className="panel__body">
          <KpiPanel filters={applied} />
        </div>
      </section>

      <ActiveComponent {...viewProps} />
    </div>
  )
}
