import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../services/posts-service.js', () => ({
  likePost: vi.fn(),
  listPosts: vi.fn(),
  listTags: vi.fn(),
  unlikePost: vi.fn(),
}))

import {
  likePost,
  listPosts,
  listTags,
  unlikePost,
} from '../../services/posts-service.js'
import { SessionContext } from '../../session/session-context.js'
import { FeedPage } from './FeedPage.jsx'

const POST = {
  id: 'post-1',
  title: 'Design system com React',
  description: 'Como organizar tokens e componentes.',
  thumbnailUrl: '/seed/feed-01.png',
  author: {
    id: 'user-1',
    name: 'Julio',
    username: 'julio',
    avatarUrl: null,
  },
  tags: [{ slug: 'react', name: 'React' }],
  likesCount: 7,
  commentsCount: 3,
  likedByMe: false,
  createdAt: '2026-11-16T12:00:00.000Z',
}

const TAGS = [
  { slug: 'react', name: 'React', postCount: 1 },
  { slug: 'css', name: 'CSS', postCount: 2 },
]

function renderFeed({ isAuthenticated = false, navigate = vi.fn() } = {}) {
  return render(
    <SessionContext.Provider
      value={{
        user: null,
        isAuthenticated,
        ready: true,
        signOut: vi.fn(),
      }}
    >
      <FeedPage navigate={navigate} />
    </SessionContext.Provider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  listTags.mockResolvedValue(TAGS)
  listPosts.mockResolvedValue({ items: [POST], page: 1, limit: 12, total: 1 })
  likePost.mockResolvedValue()
  unlikePost.mockResolvedValue()
})

describe('FeedPage', () => {
  it('loads and renders the posts', async () => {
    renderFeed()

    expect(
      await screen.findByRole('heading', { name: POST.title }),
    ).toBeInTheDocument()
    expect(listPosts).toHaveBeenCalledWith({
      search: '',
      tags: [],
      sort: 'recent',
      page: 1,
      limit: 12,
    })
  })

  it('searches on the backend after the debounce', async () => {
    const user = userEvent.setup()
    renderFeed()

    await screen.findByRole('heading', { name: POST.title })
    await user.type(screen.getByLabelText('Buscar posts'), 'React')

    await waitFor(() =>
      expect(listPosts).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'React' }),
      ),
    )
  })

  it('filters by a tag and can clear the filters', async () => {
    const user = userEvent.setup()
    renderFeed()

    await screen.findByRole('heading', { name: POST.title })
    await user.click(screen.getByRole('button', { name: 'React' }))

    await waitFor(() =>
      expect(listPosts).toHaveBeenLastCalledWith(
        expect.objectContaining({ tags: ['react'] }),
      ),
    )

    await user.click(screen.getByRole('button', { name: 'Limpar tudo' }))

    await waitFor(() =>
      expect(listPosts).toHaveBeenLastCalledWith(
        expect.objectContaining({ tags: [] }),
      ),
    )
  })

  it('sorts by popularity', async () => {
    const user = userEvent.setup()
    renderFeed()

    await screen.findByRole('heading', { name: POST.title })
    await user.click(screen.getByRole('tab', { name: 'Mais curtidos' }))

    await waitFor(() =>
      expect(listPosts).toHaveBeenLastCalledWith(
        expect.objectContaining({ sort: 'popular' }),
      ),
    )
  })

  it('sends guests to the login when they try to like', async () => {
    const user = userEvent.setup()
    const navigate = vi.fn()
    renderFeed({ navigate })

    await screen.findByRole('heading', { name: POST.title })
    await user.click(screen.getByRole('button', { name: 'Curtir post' }))

    expect(navigate).toHaveBeenCalledWith('/login')
    expect(likePost).not.toHaveBeenCalled()
  })

  it('likes optimistically when signed in', async () => {
    const user = userEvent.setup()
    renderFeed({ isAuthenticated: true })

    await screen.findByRole('heading', { name: POST.title })
    await user.click(screen.getByRole('button', { name: 'Curtir post' }))

    expect(likePost).toHaveBeenCalledWith(POST.id)
    expect(
      screen.getByRole('button', { name: 'Remover curtida' }),
    ).toBeInTheDocument()
  })

  it('shows an empty state when nothing matches', async () => {
    listPosts.mockResolvedValue({ items: [], page: 1, limit: 12, total: 0 })
    renderFeed()

    expect(
      await screen.findByText(/Nenhum post encontrado/),
    ).toBeInTheDocument()
  })
})
