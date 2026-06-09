import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../../css/auth.css'
import { getErrorMessage } from '../../shared/api/http'
import { useAppDispatch } from '../../shared/store/hooks'
import { login } from '../../shared/store/auth/authThunks'
import { DEMO_ADMIN_LOGIN, DEMO_ADMIN_PASSWORD } from '../../shared/lib/demoAuth'
import { isDemoBuild } from '../../shared/lib/demoEnv'

export function AuthPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const demo = isDemoBuild()

  const [loginValue, setLoginValue] = useState(() => (demo ? DEMO_ADMIN_LOGIN : ''))
  const [password, setPassword] = useState(() => (demo ? DEMO_ADMIN_PASSWORD : ''))

  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)

    try {
      await dispatch(login({ login: loginValue, password })).unwrap()
      navigate('/', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-card">
        <header className="auth-card__header">
          <h1 className="auth-card__title">Вход</h1>
          {demo && (
            <p className="muted auth-card__demo-hint">
              Демо: данные администратора подставлены автоматически — нажмите «Войти».
            </p>
          )}
        </header>

        <form className="auth-card__form" onSubmit={handleSubmit}>
          <label className="field">
            <div className="field__label">Логин (эл. почта или имя пользователя)</div>
            <input
              className="input"
              value={loginValue}
              onChange={(e) => setLoginValue(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label className="field">
            <div className="field__label">Пароль</div>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error && <div className="alert alert--error">{error}</div>}

          <div className="actions-row">
            <button className="btn" type="submit" disabled={pending}>
              {pending ? 'Отправка…' : 'Войти'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
