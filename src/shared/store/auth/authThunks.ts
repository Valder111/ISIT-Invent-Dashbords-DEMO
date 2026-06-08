import { createAsyncThunk } from '@reduxjs/toolkit'
import type { LoginRequest, MeResponse } from '../../api/auth'
import { generatedApi, generatedRequest } from '../../api/generatedClient'
import { ApiError } from '../../api/http'
import type { RequestUserMePatchRequest } from '../../api/generated/data-contracts'
import { isDemoBuild } from '../../lib/demoEnv'

let inflightMe: Promise<MeResponse | null> | null = null

async function demoMeFallback(): Promise<MeResponse | null> {
  if (!isDemoBuild()) return null
  const { currentMe } = await import('../../../mocks/mockDb')
  return currentMe()
}

async function loadMe(): Promise<MeResponse | null> {
  if (inflightMe) return inflightMe

  inflightMe = (async () => {
    try {
      const me = await generatedRequest<MeResponse>(() => generatedApi.users.usersMeList())
      if (me) return me
      return demoMeFallback()
    } catch (err) {
      const demo = await demoMeFallback()
      if (demo) return demo
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        return null
      }
      return null
    } finally {
      inflightMe = null
    }
  })()

  return inflightMe
}

export const fetchMe = createAsyncThunk('auth/fetchMe', loadMe)

export const login = createAsyncThunk('auth/login', async (body: LoginRequest, { rejectWithValue }) => {
  await generatedRequest(() => generatedApi.users.usersAuthCreate(body))
  const me = await loadMe()
  if (!me) {
    return rejectWithValue('Не удалось получить профиль после входа')
  }
  return me
})

export const logout = createAsyncThunk('auth/logout', async () => {
  await generatedRequest(() => generatedApi.users.usersLogoutCreate())
})

export const patchMe = createAsyncThunk('auth/patchMe', async (body: RequestUserMePatchRequest) => {
  const profile = await generatedRequest<MeResponse>(() => generatedApi.users.usersMePartialUpdate(body))
  return profile
})
