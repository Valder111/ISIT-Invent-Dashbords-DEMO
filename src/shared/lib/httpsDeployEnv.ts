/**
 * HTTPS-DEPLOY-LOGIC: временная обвязка под prod (TLS + reverse proxy).
 * В демо-сборке API идёт под BASE_URL (GitHub Pages), чтобы MSW service worker перехватывал запросы.
 */

import { isDemoBuild } from './demoEnv'

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

/** База API. Пусто = относительные /api/... (один домен за Nginx). */
export function apiBaseUrl(): string {
  if (isDemoBuild()) {
    const base = import.meta.env.BASE_URL
    if (typeof base === 'string' && base.trim() && base !== '/') {
      return trimTrailingSlash(base.trim())
    }
  }
  const raw = import.meta.env.VITE_API_BASE_URL
  if (typeof raw !== 'string' || !raw.trim()) return ''
  return trimTrailingSlash(raw.trim())
}

/** Публичный URL SPA (подсказки, будущие абсолютные ссылки). Не обязателен в dev. */
export function appPublicOrigin(): string | undefined {
  const raw = import.meta.env.VITE_PUBLIC_APP_URL
  if (typeof raw !== 'string' || !raw.trim()) return undefined
  return trimTrailingSlash(raw.trim())
}

/** true, если в сборке явно задан prod-URL (для UI-предупреждений при необходимости). */
export function isHttpsDeployBuild(): boolean {
  return Boolean(appPublicOrigin()?.startsWith('https://'))
}
