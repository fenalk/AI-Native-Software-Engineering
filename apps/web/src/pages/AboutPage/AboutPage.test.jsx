import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SessionContext } from '../../session/session-context.js'
import { AboutPage } from './AboutPage.jsx'

describe('AboutPage', () => {
  it('renders the page inside the app layout', () => {
    render(
      <SessionContext.Provider
        value={{ user: null, isAuthenticated: false, ready: true, signOut: vi.fn() }}
      >
        <AboutPage />
      </SessionContext.Provider>,
    )

    expect(
      screen.getByRole('heading', { name: 'Sobre nós' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar ao feed' })).toHaveAttribute(
      'href',
      '/feed',
    )
  })
})
