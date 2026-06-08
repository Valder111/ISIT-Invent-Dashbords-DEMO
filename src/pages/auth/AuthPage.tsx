import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../../css/auth.css'
import { getErrorMessage } from '../../shared/api/http'
import { useAppDispatch } from '../../shared/store/hooks'
import { login } from '../../shared/store/auth/authThunks'
import { isDemoBuild } from '../../shared/lib/demoEnv'

export function AuthPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const [loginValue, setLoginValue] = useState('')
  const [password, setPassword] = useState('')

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
          {isDemoBuild() && (
            <p className="muted auth-card__demo-hint">
              Демо: <strong>kiselevim@demo.isit-invent.local</strong> / <strong>demo123</strong>
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
