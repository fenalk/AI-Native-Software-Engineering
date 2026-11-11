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
import styles from './RegisterForm.module.css'

export function RegisterForm({ onSubmit }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit?.({ name, email, password, remember })
  }

  return (
    <div className={styles.root}>
      <AuthHeader title="Cadastro" description="Olá! Preencha seus dados." />

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.fields}>
          <FormField
            id="register-name"
            label="Nome"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nome completo"
            autoComplete="name"
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
              required
            />
            <div className={styles.options}>
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

        <Button type="submit" fullWidth iconRight={<ArrowForwardIcon />}>
          Cadastrar
        </Button>
      </form>

      <div className={styles.divider}>
        <Divider>ou entre com outras contas</Divider>
      </div>

      <div className={styles.social}>
        <SocialLoginGroup />
      </div>

      <div className={styles.footer}>
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
