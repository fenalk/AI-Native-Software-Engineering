import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../services/posts-service.js', () => ({
  likePost: vi.fn(),
  unlikePost: vi.fn(),
}))

import { likePost, unlikePost } from '../services/posts-service.js'
import { usePostLike } from './usePostLike.js'

const POST_ID = '9f0c5b8e-9a2f-4c5e-8a1b-3d6f7e8c9a0b'
const INITIAL_POST = {
  id: POST_ID,
  title: 'Post',
  likesCount: 4,
  likedByMe: false,
}

/** Exercises the hook the way the pages do: state in, one callback out. */
function Harness({ isAuthenticated = true, navigate, onError }) {
  const [post, setPost] = useState(INITIAL_POST)

  const handleLike = usePostLike({
    isAuthenticated,
    navigate,
    onChange: (postId, changes) => {
      setPost((current) => ({ ...current, ...changes }))
    },
    onError,
  })

  return (
    <>
      <button type="button" onClick={() => handleLike(post)}>
        {post.likedByMe ? 'remover' : 'curtir'}
      </button>
      <span data-testid="state">
        {post.likedByMe ? 'liked' : 'idle'}:{post.likesCount}
      </span>
    </>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  likePost.mockResolvedValue()
  unlikePost.mockResolvedValue()
})

describe('usePostLike', () => {
  it('applies the optimistic like and keeps it on success', async () => {
    const user = userEvent.setup()
    render(<Harness navigate={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'curtir' }))

    expect(likePost).toHaveBeenCalledWith(POST_ID)
    expect(screen.getByTestId('state')).toHaveTextContent('liked:5')
  })

  it('unlikes a post the user already liked', async () => {
    const user = userEvent.setup()
    render(<Harness navigate={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'curtir' }))
    await user.click(screen.getByRole('button', { name: 'remover' }))

    expect(unlikePost).toHaveBeenCalledWith(POST_ID)
    expect(screen.getByTestId('state')).toHaveTextContent('idle:4')
  })

  it('rolls back and reports a non-auth failure', async () => {
    const onError = vi.fn()
    likePost.mockRejectedValue({
      response: {
        status: 500,
        data: { title: 'Internal Server Error', detail: 'Deu ruim', status: 500 },
      },
    })

    const user = userEvent.setup()
    render(<Harness navigate={vi.fn()} onError={onError} />)

    await user.click(screen.getByRole('button', { name: 'curtir' }))

    await waitFor(() => expect(onError).toHaveBeenCalledWith('Deu ruim'))
    expect(screen.getByTestId('state')).toHaveTextContent('idle:4')
  })

  it('sends the user to the login when the session expired', async () => {
    const navigate = vi.fn()
    likePost.mockRejectedValue({
      response: {
        status: 401,
        data: { title: 'Unauthorized', status: 401 },
      },
    })

    const user = userEvent.setup()
    render(<Harness navigate={navigate} />)

    await user.click(screen.getByRole('button', { name: 'curtir' }))

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/login'))
    expect(screen.getByTestId('state')).toHaveTextContent('idle:4')
  })

  it('sends guests to the login without calling the API', async () => {
    const navigate = vi.fn()
    const user = userEvent.setup()
    render(<Harness isAuthenticated={false} navigate={navigate} />)

    await user.click(screen.getByRole('button', { name: 'curtir' }))

    expect(navigate).toHaveBeenCalledWith('/login')
    expect(likePost).not.toHaveBeenCalled()
  })

  it('lets the user like again after a failure', async () => {
    likePost.mockRejectedValueOnce({
      response: { status: 500, data: { title: 'Erro', status: 500 } },
    })

    const user = userEvent.setup()
    render(<Harness navigate={vi.fn()} onError={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'curtir' }))
    await waitFor(() =>
      expect(screen.getByTestId('state')).toHaveTextContent('idle:4'),
    )

    await user.click(screen.getByRole('button', { name: 'curtir' }))
    await waitFor(() => expect(likePost).toHaveBeenCalledTimes(2))
    expect(screen.getByTestId('state')).toHaveTextContent('liked:5')
  })
})
