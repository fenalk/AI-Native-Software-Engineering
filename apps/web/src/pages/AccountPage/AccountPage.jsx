import { useEffect, useState } from 'react'
import { Button } from '../../components/atoms/Button/Button.jsx'
import { getCurrentUser } from '../../services/auth-service.js'
import { toProblemDetails } from '../../services/problem-details.js'
import {
  clearAccessToken,
  readAccessToken,
} from '../../services/session-storage.js'

const defaultNavigate = (path) => window.location.assign(path)

export function AccountPage({ navigate = defaultNavigate }) {
  const [user, setUser] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!readAccessToken()) {
      navigate('/login')
      return
    }

    let active = true

    getCurrentUser()
      .then((currentUser) => {
        if (active) {
          setUser(currentUser)
          setLoading(false)
        }
      })
      .catch((requestError) => {
        if (!active) {
          return
        }

        const problem = toProblemDetails(requestError)

        if (problem.status === 401) {
          clearAccessToken()
          navigate('/login')
          return
        }

        setError(problem.detail)
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [navigate])

  function handleSignOut() {
    clearAccessToken()
    navigate('/login')
  }

  return (
    <main className="grid min-h-svh place-items-center p-6">
      <section className="w-full max-w-[380px] rounded-4xl border border-edge bg-surface p-10 shadow-card max-[520px]:rounded-[18px] max-[520px]:p-6">
        <h1 className="m-0 text-3xl font-semibold leading-normal text-ink">
          Minha conta
        </h1>

        {loading ? (
          <p
            role="status"
            className="mt-6 text-xl leading-normal text-ink"
          >
            Carregando sua conta...
          </p>
        ) : null}

        {error ? (
          <p role="alert" className="mt-6 text-sm leading-normal text-danger">
            {error}
          </p>
        ) : null}

        {user ? (
          <div className="mt-6 flex flex-col gap-1">
            <p className="m-0 text-xl leading-normal text-ink">{user.name}</p>
            <p className="m-0 text-sm leading-normal text-muted">
              {user.email}
            </p>
          </div>
        ) : null}

        {!loading ? (
          <div className="mt-8">
            <Button fullWidth onClick={handleSignOut}>
              Sair
            </Button>
          </div>
        ) : null}
      </section>
    </main>
  )
}
