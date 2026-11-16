import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MenuLink } from './MenuLink.jsx'

describe('MenuLink', () => {
  it('renders a link and marks the active page', () => {
    render(<MenuLink active href="/feed" icon="feed" label="Feed" />)

    expect(screen.getByRole('link', { name: 'Feed' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('renders a button when an action is provided', () => {
    render(<MenuLink icon="logout" label="Sair" onClick={() => {}} />)

    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument()
  })
})
