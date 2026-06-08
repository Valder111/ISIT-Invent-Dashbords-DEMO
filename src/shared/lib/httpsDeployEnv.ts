/**
 * HTTPS-DEPLOY-LOGIC: временная обвязка под prod (TLS + reverse proxy).
 * В разработке переменные не задают — axios ходит на тот же origin, Vite проксирует /api → localhost:8000.
 * После появления домена: .env.production и server/.env (см. deploy/HTTPS-DEPLOY.md).
 */

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

/** База API. Пусто = относительные /api/... (один домен за Nginx). */
export function apiBaseUrl(): string {
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
