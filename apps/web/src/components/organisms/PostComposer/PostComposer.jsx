import { useState } from 'react'
import { Button } from '../../atoms/Button/Button.jsx'
import { TextArea } from '../../atoms/TextArea/TextArea.jsx'
import { FormField } from '../../molecules/FormField/FormField.jsx'

function FieldError({ children, id }) {
  if (!children) {
    return null
  }

  return (
    <p id={id} className="m-0 text-sm leading-normal text-danger">
      {children}
    </p>
  )
}

export function PostComposer({ error, fieldErrors = {}, onSubmit, submitting }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [tags, setTags] = useState('')

  function handleSubmit(event) {
    event.preventDefault()

    onSubmit?.({
      title,
      description,
      content,
      thumbnailUrl: thumbnailUrl.trim() || undefined,
      tags: tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    })
  }

  return (
    <form
      className="flex flex-col gap-6 rounded-lg bg-surface p-6 lg:p-8"
      onSubmit={handleSubmit}
      aria-busy={submitting || undefined}
      noValidate
    >
      <h1 className="m-0 text-3xl font-semibold leading-normal text-ink">
        Publicar
      </h1>

      <FormField
        id="post-title"
        label="Título"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Um título curto para o post"
        error={fieldErrors.title}
        required
      />

      <div className="flex flex-col gap-2">
        <label
          className="text-lg font-normal leading-normal text-ink"
          htmlFor="post-description"
        >
          Descrição
        </label>
        <TextArea
          id="post-description"
          name="description"
          rows={3}
          mono={false}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Resuma o que o post ensina"
          invalid={Boolean(fieldErrors.description)}
          describedBy={
            fieldErrors.description ? 'post-description-error' : undefined
          }
          required
        />
        <FieldError id="post-description-error">
          {fieldErrors.description}
        </FieldError>
      </div>

      <div className="flex flex-col gap-2">
        <label
          className="text-lg font-normal leading-normal text-ink"
          htmlFor="post-content"
        >
          Código
        </label>
        <TextArea
          id="post-content"
          name="content"
          rows={10}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={'const greeting = "olá"\n'}
          invalid={Boolean(fieldErrors.content)}
          describedBy={fieldErrors.content ? 'post-content-error' : undefined}
          required
        />
        <FieldError id="post-content-error">{fieldErrors.content}</FieldError>
      </div>

      <FormField
        id="post-thumbnail"
        label="URL do thumbnail (opcional)"
        value={thumbnailUrl}
        onChange={(event) => setThumbnailUrl(event.target.value)}
        placeholder="/seed/feed-01.png"
        error={fieldErrors.thumbnailUrl}
      />

      <FormField
        id="post-tags"
        label="Tags"
        value={tags}
        onChange={(event) => setTags(event.target.value)}
        placeholder="react, acessibilidade"
        error={fieldErrors.tags}
      />
      <p className="-mt-4 m-0 text-sm leading-normal text-muted">
        Separe as tags por vírgula. O post aparece no filtro do feed.
      </p>

      {error ? (
        <p role="alert" className="m-0 text-sm leading-normal text-danger">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Publicando...' : 'Publicar'}
      </Button>
    </form>
  )
}
