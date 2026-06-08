import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { fetchMe } from '../store/auth/authThunks'
import { sessionCheckSkipped } from '../store/auth/authSlice'
import { useAppDispatch } from '../store/hooks'

/** Загрузка сессии при смене маршрута (как прежний useAuthState). */
export function AuthSessionSync() {
  const dispatch = useAppDispatch()
  const location = useLocation()

  useEffect(() => {
    const onAuthRoute = location.pathname === '/auth' || location.pathname.startsWith('/auth/')

    if (onAuthRoute) {
      dispatch(sessionCheckSkipped())
      return
    }

    void dispatch(fetchMe())
  }, [location.pathname, dispatch])

  return null
}
