import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AuthHeader } from './AuthHeader.jsx'

describe('AuthHeader', () => {
  it('renders the title as the page heading and its description', () => {
    render(<AuthHeader title="Cadastro" description="Olá! Preencha seus dados." />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Cadastro' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Olá! Preencha seus dados.')).toBeInTheDocument()
  })
})
