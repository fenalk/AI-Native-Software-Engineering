import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

/**
 * Node 26 exposes experimental `localStorage`/`sessionStorage` globals that
 * shadow jsdom's implementation and stay `undefined` without
 * `--localstorage-file`. Provide an in-memory Storage for the tests.
 */
function createMemoryStorage() {
  const items = new Map()

  return {
    get length() {
      return items.size
    },
    key(index) {
      return [...items.keys()][index] ?? null
    },
    getItem(key) {
      return items.has(String(key)) ? items.get(String(key)) : null
    },
    setItem(key, value) {
      items.set(String(key), String(value))
    },
    removeItem(key) {
      items.delete(String(key))
    },
    clear() {
      items.clear()
    },
  }
}

for (const name of ['localStorage', 'sessionStorage']) {
  if (!globalThis[name]) {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      value: createMemoryStorage(),
    })
  }
}

afterEach(() => {
  cleanup()
  globalThis.localStorage.clear()
  globalThis.sessionStorage.clear()
})
