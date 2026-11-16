import { render, screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

vi.mock('../../services/posts-service.js', () => ({
  createComment: vi.fn(),
  getPost: vi.fn(),
  likePost: vi.fn(),
  listComments: vi.fn(),
  unlikePost: vi.fn(),
}))

import { getPost, listComments } from '../../services/posts-service.js'
import { SessionContext } from '../../session/session-context.js'
import { expectNoA11yViolations } from '../../test/a11y.js'
import { PostPage } from './PostPage.jsx'

const POST = {
  id: 'post-1',
  title: 'Design system com React',
  description: 'Como organizar tokens e componentes.',
  content: 'const x = 1',
  thumbnailUrl: null,
  author: { id: 'u1', name: 'Julio', username: 'julio', avatarUrl: null },
  tags: [{ slug: 'react', name: 'React' }],
  likesCount: 1,
  commentsCount: 1,
  likedByMe: false,
  createdAt: '2026-11-16T12:00:00.000Z',
}

const COMMENT = {
  id: 'c1',
  body: 'Muito bom!',
  parentId: null,
  author: { id: 'u2', name: 'Marcia', username: 'marcia', avatarUrl: null },
  createdAt: '2026-11-16T13:00:00.000Z',
}

beforeEach(() => {
  vi.clearAllMocks()
  getPost.mockResolvedValue(POST)
  listComments.mockResolvedValue([COMMENT])
})

describe('PostPage (accessibility)', () => {
  it('has no WCAG 2.2 AA violations', async () => {
    const { container } = render(
      <SessionContext.Provider
        value={{
          user: { id: 'u1', name: 'Julio' },
          isAuthenticated: true,
          ready: true,
          signOut: vi.fn(),
        }}
      >
        <PostPage postId={POST.id} />
      </SessionContext.Provider>,
    )

    await screen.findByRole('heading', { name: POST.title })

    await expectNoA11yViolations(container)
  })
})
