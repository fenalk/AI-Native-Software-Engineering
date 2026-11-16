import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SideMenu } from './SideMenu.jsx'

describe('SideMenu', () => {
  it('shows Login for guests', () => {
    render(<SideMenu isAuthenticated={false} onSignOut={vi.fn()} />)

    expect(screen.getByRole('link', { name: 'Login' })).toHaveAttribute(
      'href',
      '/login',
    )
    expect(screen.queryByRole('button', { name: 'Sair' })).not.toBeInTheDocument()
  })

  it('shows Sair for signed-in users and signs out', async () => {
    const user = userEvent.setup()
    const onSignOut = vi.fn()

    render(<SideMenu isAuthenticated onSignOut={onSignOut} />)

    await user.click(screen.getByRole('button', { name: 'Sair' }))

    expect(onSignOut).toHaveBeenCalledTimes(1)
  })

  it('marks the active page', () => {
    render(
      <SideMenu active="feed" isAuthenticated={false} onSignOut={vi.fn()} />,
    )

    expect(screen.getByRole('link', { name: 'Feed' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })
})
