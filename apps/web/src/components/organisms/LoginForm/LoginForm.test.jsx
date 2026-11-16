import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LoginForm } from './LoginForm.jsx'

describe('LoginForm', () => {
  it('submits the credentials to the page handler', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<LoginForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('Email'), 'ada@exemplo.com')
    await user.type(screen.getByLabelText('Senha'), 'senha-secreta')
    await user.click(screen.getByRole('button', { name: 'Login' }))

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'ada@exemplo.com',
      password: 'senha-secreta',
      remember: true,
    })
  })

  it('links to the registration page', () => {
    render(<LoginForm onSubmit={vi.fn()} />)

    expect(
      screen.getByRole('link', { name: /Crie seu cadastro!/ }),
    ).toHaveAttribute('href', '/cadastro')
  })

  it('shows the form error and disables the button while submitting', () => {
    render(
      <LoginForm
        error="Email ou senha inválidos."
        submitting
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Email ou senha inválidos.',
    )
    expect(screen.getByRole('button', { name: 'Entrando...' })).toBeDisabled()
  })

  it('shows a validation error next to the field', () => {
    render(
      <LoginForm
        fieldErrors={{ email: 'Invalid email address' }}
        onSubmit={vi.fn()}
      />,
    )

    const email = screen.getByLabelText('Email')
    expect(email).toHaveAttribute('aria-invalid', 'true')
    expect(email).toHaveAttribute('aria-describedby', 'login-email-error')
    expect(screen.getByText('Invalid email address')).toHaveAttribute(
      'id',
      'login-email-error',
    )
  })
})
