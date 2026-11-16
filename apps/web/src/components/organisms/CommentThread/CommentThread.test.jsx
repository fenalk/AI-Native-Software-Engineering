import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CommentThread } from './CommentThread.jsx'

const AUTHOR = { id: 'u1', name: 'Marcia', username: 'marcia', avatarUrl: null }
const COMMENTS = [
  {
    id: 'c1',
    body: 'Muito bom!',
    parentId: null,
    author: AUTHOR,
    createdAt: '2026-11-16T12:00:00.000Z',
  },
  {
    id: 'c2',
    body: 'Valeu!',
    parentId: 'c1',
    author: { ...AUTHOR, id: 'u2', name: 'Julio', username: 'julio' },
    createdAt: '2026-11-16T13:00:00.000Z',
  },
]

describe('CommentThread', () => {
  it('renders top-level comments and their replies', () => {
    render(
      <CommentThread
        comments={COMMENTS}
        isAuthenticated={false}
        onRequireAuth={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByText('Comentários')).toBeInTheDocument()
    expect(screen.getByText('Muito bom!', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('Valeu!', { exact: false })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Entre' })).toHaveAttribute(
      'href',
      '/login',
    )
  })

  it('sends guests to the login when they try to reply', async () => {
    const user = userEvent.setup()
    const onRequireAuth = vi.fn()

    render(
      <CommentThread
        comments={COMMENTS}
        isAuthenticated={false}
        onRequireAuth={onRequireAuth}
        onSubmit={vi.fn()}
      />,
    )

    await user.click(screen.getAllByRole('button', { name: 'Responder' })[0])

    expect(onRequireAuth).toHaveBeenCalledTimes(1)
  })

  it('submits a new comment', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    render(
      <CommentThread
        comments={COMMENTS}
        isAuthenticated
        onRequireAuth={vi.fn()}
        onSubmit={onSubmit}
      />,
    )

    await user.type(
      screen.getByPlaceholderText('Escreva um comentário...'),
      'Novo comentário',
    )
    await user.click(screen.getByRole('button', { name: 'Comentar' }))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith('Novo comentário', null),
    )
  })
})
