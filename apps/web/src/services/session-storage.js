const STORAGE_KEY = 'code-connect.access-token'

/**
 * Saves the access token where the session should survive. A token kept only
 * for the tab goes to `sessionStorage`; "Lembrar-me" promotes it to
 * `localStorage`. The other storage is cleared so the token is never duplicated.
 */
export function saveAccessToken(token, { persist = false } = {}) {
  if (!token) {
    clearAccessToken()
    return
  }

  const target = persist ? window.localStorage : window.sessionStorage
  const previous = persist ? window.sessionStorage : window.localStorage

  target.setItem(STORAGE_KEY, token)
  previous.removeItem(STORAGE_KEY)
}

/** Returns the stored access token, if any. */
export function readAccessToken() {
  return (
    window.localStorage.getItem(STORAGE_KEY) ??
    window.sessionStorage.getItem(STORAGE_KEY)
  )
}

/** Removes the access token from both storages. */
export function clearAccessToken() {
  window.localStorage.removeItem(STORAGE_KEY)
  window.sessionStorage.removeItem(STORAGE_KEY)
}
