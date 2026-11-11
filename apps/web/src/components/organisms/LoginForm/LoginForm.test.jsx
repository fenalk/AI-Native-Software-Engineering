import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LoginForm } from './LoginForm.jsx'

describe('LoginForm', () => {
  it('submits the credentials to the page handler', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<LoginForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('Email ou usuário'), 'usuario123')
    await user.type(screen.getByLabelText('Senha'), 'senha-secreta')
    await user.click(screen.getByRole('button', { name: 'Login' }))

    expect(onSubmit).toHaveBeenCalledWith({
      identifier: 'usuario123',
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
})
