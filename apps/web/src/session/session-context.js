import { createContext, useContext } from 'react'

/**
 * Session shared by the feed pages. `isAuthenticated` is available immediately
 * from the stored token; `user` fills in after `GET /users/me` resolves.
 */
export const SessionContext = createContext({
  user: null,
  isAuthenticated: false,
  ready: true,
  signOut: () => {},
})

export function useSession() {
  return useContext(SessionContext)
}
