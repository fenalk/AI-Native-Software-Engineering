import { useState } from 'react'
import { Avatar } from '../../atoms/Avatar/Avatar.jsx'
import { Button } from '../../atoms/Button/Button.jsx'
import { TextArea } from '../../atoms/TextArea/TextArea.jsx'
import { toProblemDetails } from '../../../services/problem-details.js'

function CommentItem({
  comment,
  replies,
  isAuthenticated,
  onReplyClick,
  replyingTo,
  body,
  onBodyChange,
  onSubmit,
  submitting,
  onCancel,
  onRequireAuth,
}) {
  const isReplying = replyingTo === comment.id

  return (
    <li className="flex flex-col gap-2">
      <div className="flex items-start gap-2">
        <Avatar src={comment.author.avatarUrl} name={comment.author.name} tone="soft" />
        <p className="m-0 text-sm leading-normal text-field-ink">
          <span className="font-semibold">@{comment.author.username}</span>{' '}
          {comment.body}
        </p>
      </div>

      <div className="pl-10">
        <button
          type="button"
          className="rounded text-sm font-semibold leading-normal text-field-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          onClick={() => {
            if (!isAuthenticated) {
              onRequireAuth()
              return
            }
            onReplyClick(comment.id)
          }}
        >
          Responder
        </button>
      </div>

      {isReplying ? (
        <form
          className="flex flex-col gap-2 pl-10"
          onSubmit={(event) => onSubmit(event, comment.id)}
        >
          <TextArea
            id={`comment-reply-${comment.id}`}
            name="comment"
            rows={3}
            mono={false}
            tone="surface"
            value={body}
            onChange={(event) => onBodyChange(event.target.value)}
            placeholder={`Responder para @${comment.author.username}`}
            required
          />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Enviando...' : 'Enviar resposta'}
            </Button>
            <Button type="button" variant="ghostField" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}

      {replies.length > 0 ? (
        <ul className="m-0 flex list-none flex-col gap-2 pl-10">
          {replies.map((reply) => (
            <li key={reply.id} className="flex items-start gap-2">
              <Avatar src={reply.author.avatarUrl} name={reply.author.name} tone="soft" />
              <p className="m-0 text-sm leading-normal text-field-ink">
                <span className="font-semibold">@{reply.author.username}</span>{' '}
                {reply.body}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  )
}

/**
 * Comment list plus the reply/new-comment forms. Replies are rendered under
 * their top-level comment; the API normalizes deeper replies to one level.
 */
export function CommentThread({
  comments,
  isAuthenticated,
  onRequireAuth,
  onSubmit,
}) {
  const [replyingTo, setReplyingTo] = useState(null)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const topLevel = comments.filter((comment) => !comment.parentId)
  const repliesByParent = new Map()

  for (const comment of comments) {
    if (!comment.parentId) {
      continue
    }

    const list = repliesByParent.get(comment.parentId) ?? []
    list.push(comment)
    repliesByParent.set(comment.parentId, list)
  }

  async function handleSubmit(event, parentId = null) {
    event.preventDefault()

    if (!body.trim()) {
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await onSubmit(body.trim(), parentId)
      setBody('')
      setReplyingTo(null)
    } catch (requestError) {
      setError(toProblemDetails(requestError).detail)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="m-0 text-xl font-semibold leading-normal text-field-ink">
        Comentários
      </h2>

      {error ? (
        <p role="alert" className="m-0 text-sm leading-normal text-danger">
          {error}
        </p>
      ) : null}

      {topLevel.length === 0 ? (
        <p className="m-0 text-sm leading-normal text-field-ink">
          Ainda não há comentários.
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-6 p-0">
          {topLevel.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replies={repliesByParent.get(comment.id) ?? []}
              isAuthenticated={isAuthenticated}
              onReplyClick={(id) => {
                setReplyingTo(id)
                setBody('')
              }}
              replyingTo={replyingTo}
              body={body}
              onBodyChange={setBody}
              onSubmit={handleSubmit}
              submitting={submitting}
              onCancel={() => {
                setReplyingTo(null)
                setBody('')
              }}
              onRequireAuth={onRequireAuth}
            />
          ))}
        </ul>
      )}

      {isAuthenticated ? (
        replyingTo === null ? (
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => handleSubmit(event, null)}
          >
            <TextArea
              id="new-comment"
              name="comment"
              rows={3}
              mono={false}
              tone="surface"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Escreva um comentário..."
              required
            />
            <div>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Enviando...' : 'Comentar'}
              </Button>
            </div>
          </form>
        ) : null
      ) : (
        <p className="m-0 text-sm leading-normal text-field-ink">
          <a href="/login" className="font-semibold hover:underline">
            Entre
          </a>{' '}
          para comentar.
        </p>
      )}
    </div>
  )
}
