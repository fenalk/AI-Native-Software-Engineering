import { useState } from 'react'
import { ArrowForwardIcon } from '../../atoms/ArrowForwardIcon/ArrowForwardIcon.jsx'
import { Button } from '../../atoms/Button/Button.jsx'
import { Checkbox } from '../../atoms/Checkbox/Checkbox.jsx'
import { LoginIcon } from '../../atoms/LoginIcon/LoginIcon.jsx'
import { AuthFooter } from '../../molecules/AuthFooter/AuthFooter.jsx'
import { AuthHeader } from '../../molecules/AuthHeader/AuthHeader.jsx'
import { Divider } from '../../molecules/Divider/Divider.jsx'
import { FormField } from '../../molecules/FormField/FormField.jsx'
import { SocialLoginGroup } from '../SocialLoginGroup/SocialLoginGroup.jsx'

export function RegisterForm({
  error = null,
  fieldErrors = {},
  onSubmit,
  submitting = false,
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit?.({ name, email, password, remember })
  }

  return (
    <div className="flex flex-col">
      <AuthHeader title="Cadastro" description="Olá! Preencha seus dados." />

      <form
        className="mt-8 flex flex-col gap-8"
        onSubmit={handleSubmit}
        aria-busy={submitting || undefined}
      >
        <div className="flex flex-col gap-4">
          <FormField
            id="register-name"
            label="Nome"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nome completo"
            autoComplete="name"
            error={fieldErrors.name}
            required
          />
          <FormField
            id="register-email"
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Digite seu email"
            autoComplete="email"
            error={fieldErrors.email}
            required
          />
          <div>
            <FormField
              id="register-password"
              label="Senha"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••"
              autoComplete="new-password"
              error={fieldErrors.password}
              required
            />
            <div className="mt-2">
              <Checkbox
                id="register-remember"
                name="remember"
                label="Lembrar-me"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
            </div>
          </div>
        </div>

        {error ? (
          <p role="alert" className="m-0 text-sm leading-normal text-danger">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          fullWidth
          disabled={submitting}
          iconRight={<ArrowForwardIcon />}
        >
          {submitting ? 'Cadastrando...' : 'Cadastrar'}
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
          question="Já tem conta?"
          linkLabel="Faça seu login!"
          linkHref="/login"
          icon={<LoginIcon />}
        />
      </div>
    </div>
  )
}
