import { AuthBanner } from '../../components/molecules/AuthBanner/AuthBanner.jsx'
import { RegisterForm } from '../../components/organisms/RegisterForm/RegisterForm.jsx'
import { AuthTemplate } from '../../components/templates/AuthTemplate/AuthTemplate.jsx'

const REGISTER_BANNER = '/banner-register.png'

export function RegisterPage() {
  function handleRegister({ email }) {
    // TODO: integrar com a API (ex.: POST /users)
    console.info('[cadastro] dados enviados', { email })
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
      <RegisterForm onSubmit={handleRegister} />
    </AuthTemplate>
  )
}
