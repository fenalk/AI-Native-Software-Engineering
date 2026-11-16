import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SessionContext } from '../../../session/session-context.js'
import { AppTemplate } from './AppTemplate.jsx'

describe('AppTemplate', () => {
  it('renders the side menu and the content', () => {
    render(
      <SessionContext.Provider
        value={{ user: null, isAuthenticated: false, ready: true, signOut: vi.fn() }}
      >
        <AppTemplate active="feed">
          <h1>Conteúdo</h1>
        </AppTemplate>
      </SessionContext.Provider>,
    )

    expect(screen.getByRole('heading', { name: 'Conteúdo' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Feed' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument()
  })
})
