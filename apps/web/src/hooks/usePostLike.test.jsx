import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../services/posts-service.js', () => ({
  likePost: vi.fn(),
  unlikePost: vi.fn(),
}))

import { likePost, unlikePost } from '../services/posts-service.js'
import { SessionContext } from '../session/session-context.js'
import { usePostLike } from './usePostLike.js'

const POST = { id: 'post-1', likedByMe: false, likesCount: 3 }

function setup({ isAuthenticated = true } = {}) {
  let post = { ...POST }
  const navigate = vi.fn()
  const onError = vi.fn()
  const updatePost = vi.fn((id, update) => {
    if (id === post.id) {
      post = update(post)
    }
  })

  const wrapper = ({ children }) => (
    <SessionContext.Provider
      value={{ user: null, isAuthenticated, ready: true, signOut: vi.fn() }}
    >
      {children}
    </SessionContext.Provider>
  )

  const { result } = renderHook(
    () => usePostLike({ navigate, updatePost, onError }),
    { wrapper },
  )

  return {
    toggle: (target = post) => act(() => result.current(target)),
    current: () => post,
    navigate,
    onError,
  }
}

function problem(status, detail) {
  return {
    response: { status, data: { title: 'Error', status, detail } },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  likePost.mockResolvedValue()
  unlikePost.mockResolvedValue()
})

describe('usePostLike', () => {
  it('sends guests to the login without calling the API', async () => {
    const hook = setup({ isAuthenticated: false })

    await hook.toggle()

    expect(hook.navigate).toHaveBeenCalledWith('/login')
    expect(likePost).not.toHaveBeenCalled()
  })

  it('likes and then unlikes optimistically', async () => {
    const hook = setup()

    await hook.toggle()
    expect(likePost).toHaveBeenCalledWith('post-1')
    expect(hook.current()).toMatchObject({ likedByMe: true, likesCount: 4 })

    await hook.toggle()
    expect(unlikePost).toHaveBeenCalledWith('post-1')
    expect(hook.current()).toMatchObject({ likedByMe: false, likesCount: 3 })
  })

  it('rolls back and reports the error when the request fails', async () => {
    likePost.mockRejectedValue(problem(404, 'Post not found'))
    const hook = setup()

    await hook.toggle()

    expect(hook.current()).toMatchObject({ likedByMe: false, likesCount: 3 })
    expect(hook.onError).toHaveBeenCalledWith('Post not found')
    expect(hook.navigate).not.toHaveBeenCalled()
  })

  it('rolls back and sends to the login on 401', async () => {
    likePost.mockRejectedValue(problem(401, 'Unauthorized'))
    const hook = setup()

    await hook.toggle()

    expect(hook.current()).toMatchObject({ likedByMe: false, likesCount: 3 })
    expect(hook.navigate).toHaveBeenCalledWith('/login')
    expect(hook.onError).not.toHaveBeenCalled()
  })

  it('ignores a second click while the first request is pending', async () => {
    let resolve
    likePost.mockReturnValue(new Promise((done) => (resolve = done)))
    const hook = setup()

    let first
    act(() => {
      first = hook.toggle()
    })
    await hook.toggle(hook.current())

    expect(likePost).toHaveBeenCalledTimes(1)
    expect(unlikePost).not.toHaveBeenCalled()

    resolve()
    await first
    expect(hook.current()).toMatchObject({ likedByMe: true, likesCount: 4 })
  })
})
