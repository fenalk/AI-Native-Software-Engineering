import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('./services/auth-service.js', () => ({
  getCurrentUser: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
}))

vi.mock('./services/posts-service.js', () => ({
  createComment: vi.fn(),
  createPost: vi.fn(),
  getPost: vi.fn(),
  likePost: vi.fn(),
  listComments: vi.fn(),
  listPosts: vi.fn(),
  listTags: vi.fn(),
  unlikePost: vi.fn(),
}))

import App from './App.jsx'
import { LoginPage } from './pages/LoginPage/LoginPage.jsx'
import { RegisterPage } from './pages/RegisterPage/RegisterPage.jsx'
import { getCurrentUser } from './services/auth-service.js'
import { listPosts, listTags } from './services/posts-service.js'
import {
  clearAccessToken,
  saveAccessToken,
} from './services/session-storage.js'

afterEach(() => {
  clearAccessToken()
})

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

  it('renders the feed on / and on /feed', async () => {
    listTags.mockResolvedValue([])
    listPosts.mockResolvedValue({ items: [], page: 1, limit: 12, total: 0 })

    const root = render(<App path="/" />)
    expect(await screen.findByLabelText('Buscar posts')).toBeInTheDocument()
    root.unmount()

    render(<App path="/feed" />)
    expect(await screen.findByLabelText('Buscar posts')).toBeInTheDocument()
  })

  it('renders the account page on /conta', async () => {
    saveAccessToken('token-123')
    getCurrentUser.mockResolvedValue({
      id: 'user-1',
      name: 'Ada Lovelace',
      email: 'ada@exemplo.com',
      createdAt: '2026-11-13T12:00:00.000Z',
    })

    const { container } = render(<App path="/conta" />)

    expect(container.querySelector('h1')).toHaveTextContent('Minha conta')
    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument()
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
