import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./api-client.js', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}))

import { apiClient } from './api-client.js'
import { getCurrentUser, signIn, signUp } from './auth-service.js'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('auth-service', () => {
  it('signs in with email and password', async () => {
    const session = {
      accessToken: 'token-123',
      tokenType: 'Bearer',
      expiresIn: 3600,
    }
    apiClient.post.mockResolvedValue({ data: session })

    await expect(
      signIn({ email: 'ada@example.com', password: 'segredo123' }),
    ).resolves.toEqual(session)

    expect(apiClient.post).toHaveBeenCalledWith('/sessions', {
      email: 'ada@example.com',
      password: 'segredo123',
    })
  })

  it('registers a user', async () => {
    const user = {
      id: 'user-1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      createdAt: '2026-11-13T12:00:00.000Z',
    }
    apiClient.post.mockResolvedValue({ data: user })

    await expect(
      signUp({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        password: 'segredo123',
      }),
    ).resolves.toEqual(user)

    expect(apiClient.post).toHaveBeenCalledWith('/users', {
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'segredo123',
    })
  })

  it('reads the signed-in user', async () => {
    const user = {
      id: 'user-1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      createdAt: '2026-11-13T12:00:00.000Z',
    }
    apiClient.get.mockResolvedValue({ data: user })

    await expect(getCurrentUser()).resolves.toEqual(user)
    expect(apiClient.get).toHaveBeenCalledWith('/users/me')
  })
})
