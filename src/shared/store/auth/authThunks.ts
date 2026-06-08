import { createAsyncThunk } from '@reduxjs/toolkit'
import type { LoginRequest, MeResponse } from '../../api/auth'
import { generatedApi, generatedRequest } from '../../api/generatedClient'
import { ApiError } from '../../api/http'
import type { RequestUserMePatchRequest } from '../../api/generated/data-contracts'

let inflightMe: Promise<MeResponse | null> | null = null

async function loadMe(): Promise<MeResponse | null> {
  if (inflightMe) return inflightMe

  inflightMe = (async () => {
    try {
      return await generatedRequest<MeResponse>(() => generatedApi.users.usersMeList())
    } catch (err) {
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

export const login = createAsyncThunk('auth/login', async (body: LoginRequest) => {
  await generatedRequest(() => generatedApi.users.usersAuthCreate(body))
  return loadMe()
})

export const logout = createAsyncThunk('auth/logout', async () => {
  await generatedRequest(() => generatedApi.users.usersLogoutCreate())
})

export const patchMe = createAsyncThunk('auth/patchMe', async (body: RequestUserMePatchRequest) => {
  const profile = await generatedRequest<MeResponse>(() => generatedApi.users.usersMePartialUpdate(body))
  return profile
})
