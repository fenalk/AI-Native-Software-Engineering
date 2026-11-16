import axios from 'axios'
import { readAccessToken } from './session-storage.js'

/**
 * HTTP client for the API. In development the Vite proxy forwards `/api` to
 * the Nest server; in production the same path must be routed there, or
 * `VITE_API_URL` must point at the API.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 10_000,
  headers: { Accept: 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const accessToken = readAccessToken()

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})
