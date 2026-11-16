import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../services/auth-service.js', () => ({ getCurrentUser: vi.fn() }))

import { getCurrentUser } from '../../services/auth-service.js'
import {
  clearAccessToken,
  readAccessToken,
  saveAccessToken,
} from '../../services/session-storage.js'
import { AccountPage } from './AccountPage.jsx'

const USER = {
  id: 'user-1',
  name: 'Ada Lovelace',
  email: 'ada@exemplo.com',
  createdAt: '2026-11-13T12:00:00.000Z',
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  clearAccessToken()
})

describe('AccountPage', () => {
  it('redirects to the login page when there is no session', async () => {
    const navigate = vi.fn()

    render(<AccountPage navigate={navigate} />)

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/login'))
    expect(getCurrentUser).not.toHaveBeenCalled()
  })

  it('shows the signed-in user', async () => {
    saveAccessToken('token-123')
    getCurrentUser.mockResolvedValue(USER)

    const { container } = render(<AccountPage navigate={vi.fn()} />)

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText('ada@exemplo.com')).toBeInTheDocument()
    expect(container.querySelector('h1')).toHaveTextContent('Minha conta')
    expect(getCurrentUser).toHaveBeenCalledTimes(1)
  })

  it('clears the session and returns to the login page on "Sair"', async () => {
    const user = userEvent.setup()
    const navigate = vi.fn()
    saveAccessToken('token-123')
    getCurrentUser.mockResolvedValue(USER)

    render(<AccountPage navigate={navigate} />)
    await screen.findByText('Ada Lovelace')

    await user.click(screen.getByRole('button', { name: 'Sair' }))

    expect(readAccessToken()).toBeNull()
    expect(navigate).toHaveBeenCalledWith('/login')
  })

  it('clears an expired session and redirects', async () => {
    const navigate = vi.fn()
    saveAccessToken('token-123')
    getCurrentUser.mockRejectedValue({
      response: {
        status: 401,
        data: {
          type: 'about:blank',
          title: 'Unauthorized',
          status: 401,
          detail: 'Unauthorized',
          instance: '/users/me',
        },
      },
    })

    render(<AccountPage navigate={navigate} />)

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/login'))
    expect(readAccessToken()).toBeNull()
    expect(
      screen.queryByRole('button', { name: 'Sair' }),
    ).not.toBeInTheDocument()
  })

  it('shows a problem detail when the API fails', async () => {
    saveAccessToken('token-123')
    getCurrentUser.mockRejectedValue({
      response: {
        status: 500,
        data: {
          type: 'about:blank',
          title: 'Internal Server Error',
          status: 500,
          detail: 'An unexpected error occurred.',
          instance: '/users/me',
        },
      },
    })

    render(<AccountPage navigate={vi.fn()} />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'An unexpected error occurred.',
    )
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument()
  })
})
