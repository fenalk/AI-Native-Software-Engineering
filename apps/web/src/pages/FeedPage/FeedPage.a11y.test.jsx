import { render, screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

vi.mock('../../services/posts-service.js', () => ({
  likePost: vi.fn(),
  listPosts: vi.fn(),
  listTags: vi.fn(),
  unlikePost: vi.fn(),
}))

import { listPosts, listTags } from '../../services/posts-service.js'
import { SessionContext } from '../../session/session-context.js'
import { expectNoA11yViolations } from '../../test/a11y.js'
import { FeedPage } from './FeedPage.jsx'

const POST = {
  id: 'post-1',
  title: 'Design system com React',
  description: 'Como organizar tokens e componentes.',
  thumbnailUrl: null,
  author: { id: 'u1', name: 'Julio', username: 'julio', avatarUrl: null },
  tags: [{ slug: 'react', name: 'React' }],
  likesCount: 1,
  commentsCount: 0,
  likedByMe: false,
  createdAt: '2026-11-16T12:00:00.000Z',
}

beforeEach(() => {
  vi.clearAllMocks()
  listTags.mockResolvedValue([{ slug: 'react', name: 'React', postCount: 1 }])
  listPosts.mockResolvedValue({ items: [POST], page: 1, limit: 12, total: 1 })
})

describe('FeedPage (accessibility)', () => {
  it('has no WCAG 2.2 AA violations', async () => {
    const { container } = render(
      <SessionContext.Provider
        value={{ user: null, isAuthenticated: false, ready: true, signOut: vi.fn() }}
      >
        <FeedPage />
      </SessionContext.Provider>,
    )

    await screen.findByRole('heading', { name: POST.title })

    await expectNoA11yViolations(container)
  })
})
