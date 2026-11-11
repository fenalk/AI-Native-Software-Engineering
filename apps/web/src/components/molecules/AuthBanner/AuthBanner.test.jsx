import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AuthBanner } from './AuthBanner.jsx'

describe('AuthBanner', () => {
  it('renders the artwork and the brand logo', () => {
    render(<AuthBanner src="/banner.png" alt="Pessoa em frente ao computador" />)

    expect(screen.getByRole('img', { name: 'Pessoa em frente ao computador' }))
      .toHaveAttribute('src', '/banner.png')
    expect(screen.getByRole('img', { name: 'Code Connect' })).toBeInTheDocument()
  })

  it('can hide the logo overlay', () => {
    render(<AuthBanner src="/banner.png" alt="Banner" logo={false} />)

    expect(screen.queryByRole('img', { name: 'Code Connect' })).toBeNull()
  })
})
