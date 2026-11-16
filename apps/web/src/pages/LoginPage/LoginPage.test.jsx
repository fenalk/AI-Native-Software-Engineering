import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../services/auth-service.js', () => ({ signIn: vi.fn() }))

import { signIn } from '../../services/auth-service.js'
import {
  clearAccessToken,
  readAccessToken,
} from '../../services/session-storage.js'
import { LoginPage } from './LoginPage.jsx'

const STORAGE_KEY = 'code-connect.access-token'

async function submitLogin(user) {
  await user.type(screen.getByLabelText('Email'), 'ada@exemplo.com')
  await user.type(screen.getByLabelText('Senha'), 'segredo123')
  await user.click(screen.getByRole('button', { name: 'Login' }))
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  clearAccessToken()
})

describe('LoginPage', () => {
  it('signs in, stores the session and navigates to the account page', async () => {
    const user = userEvent.setup()
    const navigate = vi.fn()
    signIn.mockResolvedValue({ accessToken: 'token-123' })

    render(<LoginPage navigate={navigate} />)
    await submitLogin(user)

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/feed'))

    expect(signIn).toHaveBeenCalledWith({
      email: 'ada@exemplo.com',
      password: 'segredo123',
    })
    expect(readAccessToken()).toBe('token-123')
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('token-123')
  })

  it('keeps the token in session storage when "Lembrar-me" is off', async () => {
    const user = userEvent.setup()
    const navigate = vi.fn()
    signIn.mockResolvedValue({ accessToken: 'token-123' })

    render(<LoginPage navigate={navigate} />)
    await user.click(screen.getByLabelText('Lembrar-me'))
    await submitLogin(user)

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/feed'))

    expect(window.sessionStorage.getItem(STORAGE_KEY)).toBe('token-123')
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('shows a friendly message when the credentials are rejected', async () => {
    const user = userEvent.setup()
    const navigate = vi.fn()
    signIn.mockRejectedValue({
      response: {
        status: 401,
        data: {
          type: 'about:blank',
          title: 'Unauthorized',
          status: 401,
          detail: 'Invalid email or password',
          instance: '/sessions',
        },
      },
    })

    render(<LoginPage navigate={navigate} />)
    await submitLogin(user)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Email ou senha inválidos.',
    )
    expect(navigate).not.toHaveBeenCalled()
    expect(readAccessToken()).toBeNull()
  })

  it('shows validation issues next to the fields', async () => {
    const user = userEvent.setup()
    signIn.mockRejectedValue({
      response: {
        status: 400,
        data: {
          type: 'about:blank',
          title: 'Bad Request',
          status: 400,
          detail: 'The request payload is invalid.',
          instance: '/sessions',
          errors: [{ path: 'email', message: 'Invalid email address' }],
        },
      },
    })

    render(<LoginPage navigate={vi.fn()} />)
    await submitLogin(user)

    expect(await screen.findByText('Invalid email address')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('disables the button while the request is in flight', async () => {
    const user = userEvent.setup()
    const navigate = vi.fn()
    let resolveSignIn

    signIn.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSignIn = resolve
        }),
    )

    render(<LoginPage navigate={navigate} />)
    await submitLogin(user)

    expect(screen.getByRole('button', { name: 'Entrando...' })).toBeDisabled()

    resolveSignIn({ accessToken: 'token-123' })
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/feed'))
  })
})
