import { afterEach, describe, expect, it } from 'vitest'
import {
  clearAccessToken,
  readAccessToken,
  saveAccessToken,
} from './session-storage.js'

const STORAGE_KEY = 'code-connect.access-token'

afterEach(() => {
  clearAccessToken()
})

describe('session-storage', () => {
  it('keeps the token in local storage when the session must persist', () => {
    saveAccessToken('token-123', { persist: true })

    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('token-123')
    expect(window.sessionStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(readAccessToken()).toBe('token-123')
  })

  it('keeps the token in session storage by default', () => {
    saveAccessToken('token-123')

    expect(window.sessionStorage.getItem(STORAGE_KEY)).toBe('token-123')
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(readAccessToken()).toBe('token-123')
  })

  it('moves the token when the persistence changes', () => {
    saveAccessToken('first', { persist: true })
    saveAccessToken('second', { persist: false })

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(window.sessionStorage.getItem(STORAGE_KEY)).toBe('second')
  })

  it('clears the token from both storages', () => {
    saveAccessToken('token-123', { persist: true })

    clearAccessToken()

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(window.sessionStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(readAccessToken()).toBeNull()
  })
})
