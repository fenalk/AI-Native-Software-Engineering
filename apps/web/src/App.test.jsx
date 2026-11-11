import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.jsx'
import { LoginPage } from './pages/LoginPage/LoginPage.jsx'
import { RegisterPage } from './pages/RegisterPage/RegisterPage.jsx'

describe('App', () => {
  it('renders the registration page on /cadastro', () => {
    const { container } = render(<App path="/cadastro" />)

    expect(container.querySelector('h1')).toHaveTextContent('Cadastro')
  })

  it('renders the login page on /login and on unknown paths', () => {
    const login = render(<App path="/login" />)
    expect(login.container.querySelector('h1')).toHaveTextContent('Login')
    login.unmount()

    const fallback = render(<App path="/algo-inexistente" />)
    expect(fallback.container.querySelector('h1')).toHaveTextContent('Login')
  })
})

describe('auth pages', () => {
  it('RegisterPage uses its own banner image', () => {
    const { container } = render(<RegisterPage />)

    expect(container.querySelector('figure img')).toHaveAttribute(
      'src',
      '/banner-register.png',
    )
  })

  it('LoginPage keeps its banner image', () => {
    const { container } = render(<LoginPage />)

    expect(container.querySelector('figure img')).toHaveAttribute(
      'src',
      '/banner-login.png',
    )
  })
})
