import { useEffect, useState } from 'react'
import { ApiError } from '../../shared/api/http'

type State<T> = {
  data: T | null
  loading: boolean
  error: string | null
}

/**
 * Загружает аналитические данные с отменой устаревших запросов.
 * `load` должен зависеть только от значений из `deps`.
 */
export function useAnalytics<T>(load: () => Promise<T>, deps: unknown[]): State<T> {
  const [state, setState] = useState<State<T>>({ data: null, loading: true, error: null })

  useEffect(() => {
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: null }))
    load()
      .then((d) => {
        if (!cancelled) setState({ data: d, loading: false, error: null })
      })
      .catch((e) => {
        if (!cancelled) {
          setState({ data: null, loading: false, error: e instanceof ApiError ? e.message : 'Ошибка загрузки данных' })
        }
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}
