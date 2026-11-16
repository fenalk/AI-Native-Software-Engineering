import { afterEach, describe, expect, it } from 'vitest'
import { apiClient } from './api-client.js'
import { clearAccessToken, saveAccessToken } from './session-storage.js'

const originalAdapter = apiClient.defaults.adapter

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter
  clearAccessToken()
})

function stubAdapter() {
  const calls = []

  apiClient.defaults.adapter = async (config) => {
    calls.push(config)

    return {
      data: null,
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }
  }

  return calls
}

function header(config, name) {
  if (typeof config.headers?.get === 'function') {
    return config.headers.get(name)
  }

  return config.headers?.[name]
}

describe('apiClient', () => {
  it('sends the stored access token as a Bearer header', async () => {
    saveAccessToken('token-123')
    const calls = stubAdapter()

    await apiClient.get('/users/me')

    expect(header(calls[0], 'Authorization')).toBe('Bearer token-123')
  })

  it('sends no Authorization header without a stored token', async () => {
    const calls = stubAdapter()

    await apiClient.get('/users/me')

    expect(header(calls[0], 'Authorization')).toBeUndefined()
  })
})
