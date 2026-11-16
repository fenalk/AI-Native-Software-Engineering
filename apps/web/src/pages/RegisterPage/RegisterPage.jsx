import { useState } from 'react'
import { AuthBanner } from '../../components/molecules/AuthBanner/AuthBanner.jsx'
import { RegisterForm } from '../../components/organisms/RegisterForm/RegisterForm.jsx'
import { AuthTemplate } from '../../components/templates/AuthTemplate/AuthTemplate.jsx'
import { signIn, signUp } from '../../services/auth-service.js'
import {
  toFieldErrors,
  toProblemDetails,
} from '../../services/problem-details.js'
import { saveAccessToken } from '../../services/session-storage.js'

const REGISTER_BANNER = '/banner-register.png'

const defaultNavigate = (path) => window.location.assign(path)

export function RegisterPage({ navigate = defaultNavigate }) {
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  async function handleRegister({ name, email, password, remember }) {
    setError(null)
    setFieldErrors({})
    setSubmitting(true)

    try {
      await signUp({ name, email, password })

      const { accessToken } = await signIn({ email, password })

      saveAccessToken(accessToken, { persist: remember })
      navigate('/conta')
    } catch (requestError) {
      const problem = toProblemDetails(requestError)
      const issues = toFieldErrors(problem)

      setFieldErrors(issues)

      if (Object.keys(issues).length > 0) {
        setError(null)
      } else if (problem.status === 409) {
        setError('Este email já está cadastrado.')
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
          src={REGISTER_BANNER}
          alt="Pessoa de óculos à frente de um notebook, cercada por painéis digitais iluminados em verde"
        />
      }
    >
      <RegisterForm
        onSubmit={handleRegister}
        submitting={submitting}
        error={error}
        fieldErrors={fieldErrors}
      />
    </AuthTemplate>
  )
}
