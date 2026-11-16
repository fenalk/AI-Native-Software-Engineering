import { useEffect, useState } from 'react'
import { PostComposer } from '../../components/organisms/PostComposer/PostComposer.jsx'
import { AppTemplate } from '../../components/templates/AppTemplate/AppTemplate.jsx'
import { createPost } from '../../services/posts-service.js'
import {
  toFieldErrors,
  toProblemDetails,
} from '../../services/problem-details.js'
import { useSession } from '../../session/session-context.js'

const POST_FIELDS = new Set([
  'title',
  'description',
  'content',
  'thumbnailUrl',
  'tags',
])

const defaultNavigate = (path) => window.location.assign(path)

export function PublishPage({ navigate = defaultNavigate }) {
  const { isAuthenticated } = useSession()
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])

  async function handleSubmit(input) {
    setError(null)
    setFieldErrors({})
    setSubmitting(true)

    try {
      const post = await createPost(input)
      navigate(`/posts/${post.id}`)
    } catch (requestError) {
      const problem = toProblemDetails(requestError)

      if (problem.status === 401) {
        navigate('/login')
        return
      }

      const issues = toFieldErrors(problem, POST_FIELDS)
      setFieldErrors(issues)
      setError(Object.keys(issues).length > 0 ? null : problem.detail)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppTemplate active="feed">
      {isAuthenticated ? (
        <PostComposer
          error={error}
          fieldErrors={fieldErrors}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      ) : null}
    </AppTemplate>
  )
}
