import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PostActions } from './PostActions.jsx'

const POST = {
  id: 'post-1',
  title: 'Design system',
  likesCount: 2,
  commentsCount: 3,
  likedByMe: false,
  author: { id: 'u1', name: 'Julio', username: 'julio', avatarUrl: null },
}

describe('PostActions', () => {
  it('renders the counts and author and triggers the like', async () => {
    const user = userEvent.setup()
    const onLike = vi.fn()

    render(<PostActions post={POST} onLike={onLike} />)

    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('@julio')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Curtir post' }))

    expect(onLike).toHaveBeenCalledWith(POST)
  })

  it('reflects an existing like', () => {
    render(<PostActions post={{ ...POST, likedByMe: true }} />)

    expect(
      screen.getByRole('button', { name: 'Remover curtida' }),
    ).toHaveAttribute('aria-pressed', 'true')
  })
})
