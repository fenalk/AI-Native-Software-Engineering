import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, it, vi } from 'vitest'

vi.mock('../../services/auth-service.js', () => ({ getCurrentUser: vi.fn() }))

import { getCurrentUser } from '../../services/auth-service.js'
import {
  clearAccessToken,
  saveAccessToken,
} from '../../services/session-storage.js'
import { expectNoA11yViolations } from '../../test/a11y.js'
import { AccountPage } from './AccountPage.jsx'

beforeEach(() => {
  saveAccessToken('token-123')
  getCurrentUser.mockResolvedValue({
    id: 'user-1',
    name: 'Ada Lovelace',
    email: 'ada@exemplo.com',
    createdAt: '2026-11-13T12:00:00.000Z',
  })
})

afterEach(() => {
  clearAccessToken()
})

describe('AccountPage (accessibility)', () => {
  it('has no WCAG 2.2 AA violations', async () => {
    const { container } = render(<AccountPage navigate={vi.fn()} />)

    await screen.findByText('Ada Lovelace')

    await expectNoA11yViolations(container)
  })
})
