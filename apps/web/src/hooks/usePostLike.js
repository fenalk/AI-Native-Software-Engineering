import { useCallback, useRef } from 'react'
import { likePost, unlikePost } from '../services/posts-service.js'
import { toProblemDetails } from '../services/problem-details.js'

/**
 * Optimistic like toggle shared by the feed and the post page.
 *
 * - guests are sent to the login instead of calling the API;
 * - `onChange(postId, { likedByMe, likesCount })` applies the optimistic state
 *   and the rollback, so each screen decides how its state is shaped;
 * - a second click while the first request is in flight is ignored, which
 *   otherwise leaves two requests racing and the counter wrong;
 * - a `401` sends the user to the login page, any other failure goes to
 *   `onError`.
 */
export function usePostLike({ isAuthenticated, navigate, onChange, onError }) {
  const pending = useRef(new Set())

  return useCallback(
    async (post) => {
      if (!isAuthenticated) {
        navigate('/login')
        return
      }

      if (pending.current.has(post.id)) {
        return
      }

      const willLike = !post.likedByMe
      const nextLikesCount = Math.max(
        0,
        post.likesCount + (willLike ? 1 : -1),
      )

      pending.current.add(post.id)
      onChange(post.id, {
        likedByMe: willLike,
        likesCount: nextLikesCount,
      })

      try {
        await (willLike ? likePost(post.id) : unlikePost(post.id))
      } catch (requestError) {
        onChange(post.id, {
          likedByMe: post.likedByMe,
          likesCount: post.likesCount,
        })

        const problem = toProblemDetails(requestError)
        if (problem.status === 401) {
          navigate('/login')
          return
        }

        onError?.(problem.detail)
      } finally {
        pending.current.delete(post.id)
      }
    },
    [isAuthenticated, navigate, onChange, onError],
  )
}
