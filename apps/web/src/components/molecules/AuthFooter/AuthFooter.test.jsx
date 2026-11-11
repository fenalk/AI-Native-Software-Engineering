import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AuthFooter } from './AuthFooter.jsx'

describe('AuthFooter', () => {
  it('renders the question and the accent link with its icon', () => {
    render(
      <AuthFooter
        question="Já tem conta?"
        linkLabel="Faça seu login!"
        linkHref="/login"
        icon={<svg data-testid="icon" />}
      />,
    )

    expect(screen.getByText('Já tem conta?')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /Faça seu login!/ })
    expect(link).toHaveAttribute('href', '/login')
    expect(link).toContainElement(screen.getByTestId('icon'))
  })
})
