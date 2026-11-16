import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../services/posts-service.js', () => ({
  createComment: vi.fn(),
  getPost: vi.fn(),
  likePost: vi.fn(),
  listComments: vi.fn(),
  unlikePost: vi.fn(),
}))

import {
  createComment,
  getPost,
  listComments,
} from '../../services/posts-service.js'
import { SessionContext } from '../../session/session-context.js'
import { PostPage } from './PostPage.jsx'

const POST = {
  id: 'post-1',
  title: 'Design system com React',
  description: 'Como organizar tokens e componentes.',
  content: 'const tokens = {}',
  thumbnailUrl: null,
  author: {
    id: 'user-1',
    name: 'Julio',
    username: 'julio',
    avatarUrl: null,
  },
  tags: [{ slug: 'react', name: 'React' }],
  likesCount: 1,
  commentsCount: 1,
  likedByMe: false,
  createdAt: '2026-11-16T12:00:00.000Z',
}

const COMMENT = {
  id: 'comment-1',
  body: 'Achei muito bom!',
  parentId: null,
  author: {
    id: 'user-2',
    name: 'Marcia',
    username: 'marcia',
    avatarUrl: null,
  },
  createdAt: '2026-11-16T13:00:00.000Z',
}

function renderPost({ isAuthenticated = false, navigate = vi.fn() } = {}) {
  return render(
    <SessionContext.Provider
      value={{
        user: null,
        isAuthenticated,
        ready: true,
        signOut: vi.fn(),
      }}
    >
      <PostPage postId={POST.id} navigate={navigate} />
    </SessionContext.Provider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  getPost.mockResolvedValue(POST)
  listComments.mockResolvedValue([COMMENT])
})

describe('PostPage', () => {
  it('renders the post, code and comments', async () => {
    renderPost()

    expect(
      await screen.findByRole('heading', { name: POST.title }),
    ).toBeInTheDocument()
    expect(screen.getByText('const tokens = {}')).toBeInTheDocument()
    expect(screen.getByText('Achei muito bom!', { exact: false })).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'Post sem imagem de prévia' }),
    ).toBeInTheDocument()
  })

  it('hides the comment form from guests and offers login', async () => {
    renderPost()

    await screen.findByRole('heading', { name: POST.title })

    expect(screen.queryByPlaceholderText('Escreva um comentário...')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Entre' })).toHaveAttribute(
      'href',
      '/login',
    )
  })

  it('adds a comment when signed in', async () => {
    const user = userEvent.setup()
    const created = {
      ...COMMENT,
      id: 'comment-2',
      body: 'Novo comentário',
      author: { ...COMMENT.author, name: 'Ada', username: 'ada' },
    }
    createComment.mockResolvedValue(created)

    renderPost({ isAuthenticated: true })

    await screen.findByRole('heading', { name: POST.title })
    await user.type(
      screen.getByPlaceholderText('Escreva um comentário...'),
      'Novo comentário',
    )
    await user.click(screen.getByRole('button', { name: 'Comentar' }))

    await waitFor(() =>
      expect(createComment).toHaveBeenCalledWith(POST.id, {
        body: 'Novo comentário',
      }),
    )
    expect(await screen.findByText('Novo comentário', { exact: false })).toBeInTheDocument()
  })
})
