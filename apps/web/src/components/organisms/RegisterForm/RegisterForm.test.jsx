import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RegisterForm } from './RegisterForm.jsx'

describe('RegisterForm', () => {
  it('submits the filled data to the page handler', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<RegisterForm onSubmit={onSubmit} />)

    expect(
      screen.getByRole('heading', { name: 'Cadastro' }),
    ).toBeInTheDocument()

    await user.type(screen.getByLabelText('Nome'), 'Ana Silva')
    await user.type(screen.getByLabelText('Email'), 'ana@exemplo.com')
    await user.type(screen.getByLabelText('Senha'), 'segredo123')
    await user.click(screen.getByLabelText('Lembrar-me'))
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      name: 'Ana Silva',
      email: 'ana@exemplo.com',
      password: 'segredo123',
      remember: false,
    })
  })

  it('links back to the login page', () => {
    render(<RegisterForm onSubmit={vi.fn()} />)

    expect(screen.getByRole('link', { name: /Faça seu login!/ })).toHaveAttribute(
      'href',
      '/login',
    )
  })
})
