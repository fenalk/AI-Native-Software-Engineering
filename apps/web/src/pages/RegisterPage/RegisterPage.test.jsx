import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../services/auth-service.js', () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}))

import { signIn, signUp } from '../../services/auth-service.js'
import {
  clearAccessToken,
  readAccessToken,
} from '../../services/session-storage.js'
import { RegisterPage } from './RegisterPage.jsx'

async function fillForm(user) {
  await user.type(screen.getByLabelText('Nome'), 'Ada Lovelace')
  await user.type(screen.getByLabelText('Email'), 'ada@exemplo.com')
  await user.type(screen.getByLabelText('Senha'), 'segredo123')
  await user.click(screen.getByRole('button', { name: 'Cadastrar' }))
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  clearAccessToken()
})

describe('RegisterPage', () => {
  it('registers, signs in, stores the session and navigates to the account', async () => {
    const user = userEvent.setup()
    const navigate = vi.fn()
    signUp.mockResolvedValue({
      id: 'user-1',
      name: 'Ada Lovelace',
      email: 'ada@exemplo.com',
      createdAt: '2026-11-13T12:00:00.000Z',
    })
    signIn.mockResolvedValue({ accessToken: 'token-123' })

    render(<RegisterPage navigate={navigate} />)
    await fillForm(user)

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/conta'))

    expect(signUp).toHaveBeenCalledWith({
      name: 'Ada Lovelace',
      email: 'ada@exemplo.com',
      password: 'segredo123',
    })
    expect(signIn).toHaveBeenCalledWith({
      email: 'ada@exemplo.com',
      password: 'segredo123',
    })
    expect(readAccessToken()).toBe('token-123')
  })

  it('shows a friendly message when the email is already registered', async () => {
    const user = userEvent.setup()
    const navigate = vi.fn()
    signUp.mockRejectedValue({
      response: {
        status: 409,
        data: {
          type: 'about:blank',
          title: 'Conflict',
          status: 409,
          detail: 'Email already registered',
          instance: '/users',
        },
      },
    })

    render(<RegisterPage navigate={navigate} />)
    await fillForm(user)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Este email já está cadastrado.',
    )
    expect(signIn).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('does not sign in when the registration fails validation', async () => {
    const user = userEvent.setup()
    signUp.mockRejectedValue({
      response: {
        status: 400,
        data: {
          type: 'about:blank',
          title: 'Bad Request',
          status: 400,
          detail: 'The request payload is invalid.',
          instance: '/users',
          errors: [
            {
              path: 'password',
              message: 'Too small: expected string to have >=8 characters',
            },
          ],
        },
      },
    })

    render(<RegisterPage navigate={vi.fn()} />)
    await fillForm(user)

    expect(
      await screen.findByText(
        'Too small: expected string to have >=8 characters',
      ),
    ).toBeInTheDocument()
    expect(signIn).not.toHaveBeenCalled()
  })
})
