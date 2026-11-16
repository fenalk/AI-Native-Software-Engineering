import { apiClient } from './api-client.js'

/** Exchanges email and password for a stateless access token. */
export async function signIn({ email, password }) {
  const { data } = await apiClient.post('/sessions', { email, password })

  return data
}

/** Registers a user. The API answers `201` with the public user. */
export async function signUp({ name, email, password }) {
  const { data } = await apiClient.post('/users', { name, email, password })

  return data
}

/** Reads the signed-in user; requires the Bearer token set by the client. */
export async function getCurrentUser() {
  const { data } = await apiClient.get('/users/me')

  return data
}
