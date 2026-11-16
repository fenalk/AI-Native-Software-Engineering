import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Tag } from './Tag.jsx'

describe('Tag', () => {
  it('renders a static tag by default', () => {
    render(<Tag>React</Tag>)

    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders an interactive, pressed tag with a remove icon', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(
      <Tag onClick={onClick} pressed removeLabel="Remover filtro React">
        React
      </Tag>,
    )

    const button = screen.getByRole('button', { name: 'Remover filtro React' })
    expect(button).toHaveAttribute('aria-pressed', 'true')

    await user.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
