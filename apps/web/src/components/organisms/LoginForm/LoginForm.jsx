import { useState } from 'react'
import { ArrowForwardIcon } from '../../atoms/ArrowForwardIcon/ArrowForwardIcon.jsx'
import { Button } from '../../atoms/Button/Button.jsx'
import { Checkbox } from '../../atoms/Checkbox/Checkbox.jsx'
import { Link } from '../../atoms/Link/Link.jsx'
import { LoginIcon } from '../../atoms/LoginIcon/LoginIcon.jsx'
import { AuthFooter } from '../../molecules/AuthFooter/AuthFooter.jsx'
import { AuthHeader } from '../../molecules/AuthHeader/AuthHeader.jsx'
import { Divider } from '../../molecules/Divider/Divider.jsx'
import { FormField } from '../../molecules/FormField/FormField.jsx'
import { SocialLoginGroup } from '../SocialLoginGroup/SocialLoginGroup.jsx'

export function LoginForm({ onSubmit }) {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit?.({ identifier, password, remember })
  }

  return (
    <div className="flex flex-col">
      <AuthHeader title="Login" description="Boas-vindas! Faça seu login." />

      <form className="mt-8 flex flex-col gap-8" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4">
          <FormField
            id="login-identifier"
            label="Email ou usuário"
            name="identifier"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder="usuario123"
            autoComplete="username"
            required
          />
          <FormField
            id="login-password"
            label="Senha"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••"
            autoComplete="current-password"
            required
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <Checkbox
            id="login-remember"
            name="remember"
            label="Lembrar-me"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
          />
          <Link href="#recuperar-senha" variant="subtle">
            Esqueci a senha
          </Link>
        </div>

        <Button type="submit" fullWidth iconRight={<ArrowForwardIcon />}>
          Login
        </Button>
      </form>

      <div className="mt-8">
        <Divider>ou entre com outras contas</Divider>
      </div>

      <div className="mt-2">
        <SocialLoginGroup />
      </div>

      <div className="mt-6">
        <AuthFooter
          question="Ainda não tem conta?"
          linkLabel="Crie seu cadastro!"
          linkHref="/cadastro"
          icon={<LoginIcon />}
        />
      </div>
    </div>
  )
}
