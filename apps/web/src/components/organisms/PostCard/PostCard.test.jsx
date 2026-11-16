import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PostCard } from './PostCard.jsx'

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
  tags: [
    { slug: 'react', name: 'React' },
    { slug: 'front-end', name: 'Front-end' },
  ],
  likesCount: 7,
  commentsCount: 3,
  likedByMe: false,
  createdAt: '2026-11-16T12:00:00.000Z',
}

describe('PostCard', () => {
  it('renders the post summary, tags and author', () => {
    render(<PostCard post={POST} />)

    expect(
      screen.getByRole('heading', { name: 'Design system com React' }),
    ).toBeInTheDocument()
    expect(screen.getByText(POST.description)).toBeInTheDocument()
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('Front-end')).toBeInTheDocument()
    expect(screen.getByText('@julio')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('calls onLike with the post when the like button is clicked', async () => {
    const user = userEvent.setup()
    const onLike = vi.fn()

    render(<PostCard post={POST} onLike={onLike} />)

    await user.click(screen.getByRole('button', { name: 'Curtir post' }))

    expect(onLike).toHaveBeenCalledWith(POST)
  })

  it('renders the title as a first-level heading on the detail variant', () => {
    const { container } = render(<PostCard post={POST} variant="detail" />)

    expect(container.querySelector('h1')).toHaveTextContent(POST.title)
  })
})
