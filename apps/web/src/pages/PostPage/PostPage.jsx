import { useCallback, useEffect, useState } from 'react'
import { Link } from '../../components/atoms/Link/Link.jsx'
import { CommentThread } from '../../components/organisms/CommentThread/CommentThread.jsx'
import { PostCard } from '../../components/organisms/PostCard/PostCard.jsx'
import { AppTemplate } from '../../components/templates/AppTemplate/AppTemplate.jsx'
import {
  createComment,
  getPost,
  listComments,
} from '../../services/posts-service.js'
import { toProblemDetails } from '../../services/problem-details.js'
import { usePostLike } from '../../hooks/usePostLike.js'
import { useSession } from '../../session/session-context.js'

const defaultNavigate = (path) => window.location.assign(path)

export function PostPage({ navigate = defaultNavigate, postId }) {
  const { isAuthenticated } = useSession()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true

    Promise.all([getPost(postId), listComments(postId)])
      .then(([loadedPost, loadedComments]) => {
        if (!active) {
          return
        }

        setPost(loadedPost)
        setComments(loadedComments)
      })
      .catch((requestError) => {
        if (active) {
          setError(toProblemDetails(requestError).detail)
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [postId])

  const applyLike = useCallback((_postId, changes) => {
    setPost((current) => (current ? { ...current, ...changes } : current))
  }, [])

  const handleLike = usePostLike({
    isAuthenticated,
    navigate,
    onChange: applyLike,
    onError: setError,
  })

  async function handleComment(body, parentId) {
    try {
      const comment = await createComment(postId, {
        body,
        ...(parentId ? { parentId } : {}),
      })

      setComments((current) => [...current, comment])
      setPost((current) =>
        current
          ? { ...current, commentsCount: current.commentsCount + 1 }
          : current,
      )
    } catch (requestError) {
      if (toProblemDetails(requestError).status === 401) {
        navigate('/login')
      }

      throw requestError
    }
  }

  return (
    <AppTemplate active="feed">
      {loading ? (
        <p role="status" className="m-0 text-xl leading-normal text-ink">
          Carregando post...
        </p>
      ) : null}

      {!loading && error ? (
        <section className="flex flex-col gap-4 rounded-lg bg-surface p-8">
          <h1 className="m-0 text-3xl font-semibold leading-normal text-ink">
            Post não encontrado
          </h1>
          <p role="alert" className="m-0 text-sm leading-normal text-danger">
            {error}
          </p>
          <Link href="/feed" variant="accent">
            Voltar ao feed
          </Link>
        </section>
      ) : null}

      {!loading && post ? (
        <div className="flex flex-col gap-10">
          <PostCard post={post} variant="detail" onLike={handleLike} />

          <section aria-labelledby="post-code" className="flex flex-col gap-2">
            <h2
              id="post-code"
              className="m-0 text-xl font-semibold leading-normal text-muted"
            >
              Código:
            </h2>
            <pre className="m-0 overflow-x-auto rounded-lg bg-surface p-4 font-mono text-sm leading-normal text-ink-soft shadow-editor">
              <code>{post.content}</code>
            </pre>
          </section>

          <section
            id="comentarios"
            aria-label="Comentários"
            className="bg-field px-4 py-8 text-field-ink"
          >
            <CommentThread
              comments={comments}
              isAuthenticated={isAuthenticated}
              onRequireAuth={() => navigate('/login')}
              onSubmit={handleComment}
            />
          </section>
        </div>
      ) : null}
    </AppTemplate>
  )
}
