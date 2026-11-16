import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../services/posts-service.js', () => ({
  createPost: vi.fn(),
}))

import { createPost } from '../../services/posts-service.js'
import { SessionContext } from '../../session/session-context.js'
import { PublishPage } from './PublishPage.jsx'

function renderPublish({ isAuthenticated = true, navigate = vi.fn() } = {}) {
  return render(
    <SessionContext.Provider
      value={{
        user: null,
        isAuthenticated,
        ready: true,
        signOut: vi.fn(),
      }}
    >
      <PublishPage navigate={navigate} />
    </SessionContext.Provider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('PublishPage', () => {
  it('sends guests to the login', async () => {
    const navigate = vi.fn()
    renderPublish({ isAuthenticated: false, navigate })

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/login'))
  })

  it('creates a post and navigates to its detail page', async () => {
    const user = userEvent.setup()
    const navigate = vi.fn()
    createPost.mockResolvedValue({ id: 'post-1' })

    renderPublish({ navigate })

    await user.type(screen.getByLabelText('Título'), 'Meu post')
    await user.type(screen.getByLabelText('Descrição'), 'Uma descrição')
    await user.type(screen.getByLabelText('Código'), 'const x = 1')
    await user.type(screen.getByLabelText('Tags'), 'react, css')
    await user.click(screen.getByRole('button', { name: 'Publicar' }))

    await waitFor(() =>
      expect(createPost).toHaveBeenCalledWith({
        title: 'Meu post',
        description: 'Uma descrição',
        content: 'const x = 1',
        thumbnailUrl: undefined,
        tags: ['react', 'css'],
      }),
    )
    expect(navigate).toHaveBeenCalledWith('/posts/post-1')
  })
})
