import { AuthBanner } from '../../components/molecules/AuthBanner/AuthBanner.jsx'
import { LoginForm } from '../../components/organisms/LoginForm/LoginForm.jsx'
import { AuthTemplate } from '../../components/templates/AuthTemplate/AuthTemplate.jsx'

const LOGIN_BANNER = '/banner-login.png'

export function LoginPage() {
  function handleLogin({ identifier }) {
    // TODO: integrar com a API (ex.: POST /auth/login)
    console.info('[login] credenciais enviadas', { identifier })
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
      <LoginForm onSubmit={handleLogin} />
    </AuthTemplate>
  )
}
