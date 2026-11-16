import { useState } from 'react'
import { AuthBanner } from '../../components/molecules/AuthBanner/AuthBanner.jsx'
import { LoginForm } from '../../components/organisms/LoginForm/LoginForm.jsx'
import { AuthTemplate } from '../../components/templates/AuthTemplate/AuthTemplate.jsx'
import { signIn } from '../../services/auth-service.js'
import {
  toFieldErrors,
  toProblemDetails,
} from '../../services/problem-details.js'
import { saveAccessToken } from '../../services/session-storage.js'

const LOGIN_BANNER = '/banner-login.png'

const defaultNavigate = (path) => window.location.assign(path)

export function LoginPage({ navigate = defaultNavigate }) {
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  async function handleLogin({ email, password, remember }) {
    setError(null)
    setFieldErrors({})
    setSubmitting(true)

    try {
      const { accessToken } = await signIn({ email, password })

      saveAccessToken(accessToken, { persist: remember })
      navigate('/feed')
    } catch (requestError) {
      const problem = toProblemDetails(requestError)
      const issues = toFieldErrors(problem)

      setFieldErrors(issues)

      if (Object.keys(issues).length > 0) {
        setError(null)
      } else if (problem.status === 401) {
        setError('Email ou senha inválidos.')
      } else {
        setError(problem.detail)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthTemplate
      banner={
        <AuthBanner
          src={LOGIN_BANNER}
          alt="Pessoa usando um computador em um ambiente com painéis digitais iluminados em verde"
        />
      }
    >
      <LoginForm
        onSubmit={handleLogin}
        submitting={submitting}
        error={error}
        fieldErrors={fieldErrors}
      />
    </AuthTemplate>
  )
}
