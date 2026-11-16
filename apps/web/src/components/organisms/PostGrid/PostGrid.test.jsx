import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PostGrid } from './PostGrid.jsx'

const BASE_POST = {
  description: 'Descrição',
  thumbnailUrl: null,
  author: { id: 'u1', name: 'Julio', username: 'julio', avatarUrl: null },
  tags: [],
  likesCount: 0,
  commentsCount: 0,
  likedByMe: false,
  createdAt: '2026-11-16T12:00:00.000Z',
}

describe('PostGrid', () => {
  it('renders one card per post', () => {
    render(
      <PostGrid
        posts={[
          { ...BASE_POST, id: 'p1', title: 'Primeiro post' },
          { ...BASE_POST, id: 'p2', title: 'Segundo post' },
        ]}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Primeiro post' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Segundo post' }),
    ).toBeInTheDocument()
  })
})
