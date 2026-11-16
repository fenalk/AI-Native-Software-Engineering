import { useRef } from 'react'
import { likePost, unlikePost } from '../services/posts-service.js'
import { toProblemDetails } from '../services/problem-details.js'
import { useSession } from '../session/session-context.js'

function withLike(post, liked) {
  return {
    ...post,
    likedByMe: liked,
    likesCount: Math.max(0, post.likesCount + (liked ? 1 : -1)),
  }
}

/**
 * Optimistic like/unlike shared by the feed and the post detail.
 *
 * - guests are sent to `/login`;
 * - the post is updated at once through `updatePost(id, update)` and rolled
 *   back to its previous values when the request fails;
 * - a `401` (expired session) sends the user to `/login`, any other failure
 *   reaches `onError(detail)`;
 * - clicks on a post whose request is still pending are ignored, so a double
 *   click cannot race a like against its own unlike.
 */
export function usePostLike({ navigate, updatePost, onError }) {
  const { isAuthenticated } = useSession()
  const pending = useRef(new Set())

  return async function toggleLike(post) {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (pending.current.has(post.id)) {
      return
    }

    const willLike = !post.likedByMe
    pending.current.add(post.id)
    updatePost(post.id, (current) => withLike(current, willLike))

    try {
      await (willLike ? likePost(post.id) : unlikePost(post.id))
    } catch (requestError) {
      updatePost(post.id, (current) => ({
        ...current,
        likedByMe: post.likedByMe,
        likesCount: post.likesCount,
      }))

      const problem = toProblemDetails(requestError)
      if (problem.status === 401) {
        navigate('/login')
        return
      }

      onError?.(problem.detail)
    } finally {
      pending.current.delete(post.id)
    }
  }
}
