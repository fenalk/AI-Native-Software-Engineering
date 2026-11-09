import { useState } from 'react'
import { Button } from '../../atoms/Button/Button.jsx'
import { Checkbox } from '../../atoms/Checkbox/Checkbox.jsx'
import { Link } from '../../atoms/Link/Link.jsx'
import { AuthHeader } from '../../molecules/AuthHeader/AuthHeader.jsx'
import { Divider } from '../../molecules/Divider/Divider.jsx'
import { FormField } from '../../molecules/FormField/FormField.jsx'
import { SocialLoginGroup } from '../SocialLoginGroup/SocialLoginGroup.jsx'
import styles from './LoginForm.module.css'

function ArrowRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M3.5 9h11m0 0-4.2-4.2M14.5 9l-4.2 4.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M11.1 2.4a1.7 1.7 0 0 1 2.5 2.4l-6.9 7-3 .6.6-3 6.8-7Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M2 14h12"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function LoginForm({ onSubmit }) {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit?.({ identifier, password, remember })
  }

  return (
    <div className={styles.root}>
      <AuthHeader
        title="Login"
        description="Boas-vindas! Faça seu login."
      />

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.fields}>
          <FormField
            id="login-identifier"
            label="Email ou usuário"
            name="identifier"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder="usuário123"
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

        <div className={styles.options}>
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

        <Button type="submit" fullWidth iconRight={<ArrowRightIcon />}>
          Login
        </Button>
      </form>

      <div className={styles.divider}>
        <Divider>ou entre com outras contas</Divider>
      </div>

      <div className={styles.social}>
        <SocialLoginGroup />
      </div>

      <p className={styles.signup}>
        <span>Ainda não tem conta?</span>
        <Link href="#cadastro" variant="accent">
          Crie seu cadastro!
          <PencilIcon />
        </Link>
      </p>
    </div>
  )
}
