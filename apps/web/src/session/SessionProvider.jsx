import { useEffect, useMemo, useState } from 'react'
import { getCurrentUser } from '../services/auth-service.js'
import { toProblemDetails } from '../services/problem-details.js'
import {
  clearAccessToken,
  readAccessToken,
} from '../services/session-storage.js'
import { SessionContext } from './session-context.js'

const defaultNavigate = (path) => window.location.assign(path)

/**
 * Loads the signed-in user once per app mount. Guests never trigger a request,
 * so the public feed does not depend on `GET /users/me`.
 */
export function SessionProvider({ children, navigate = defaultNavigate }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    Boolean(readAccessToken()),
  )
  const [ready, setReady] = useState(() => !readAccessToken())

  useEffect(() => {
    if (!readAccessToken()) {
      return
    }

    let active = true

    getCurrentUser()
      .then((currentUser) => {
        if (active) {
          setUser(currentUser)
          setIsAuthenticated(true)
          setReady(true)
        }
      })
      .catch((requestError) => {
        if (!active) {
          return
        }

        if (toProblemDetails(requestError).status === 401) {
          clearAccessToken()
          setUser(null)
          setIsAuthenticated(false)
        }

        setReady(true)
      })

    return () => {
      active = false
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      ready,
      signOut() {
        clearAccessToken()
        setUser(null)
        setIsAuthenticated(false)
        navigate('/feed')
      },
    }),
    [isAuthenticated, navigate, ready, user],
  )

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  )
}
