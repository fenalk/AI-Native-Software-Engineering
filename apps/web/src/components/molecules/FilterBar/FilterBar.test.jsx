import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FilterBar } from './FilterBar.jsx'

const TAGS = [
  { slug: 'react', name: 'React' },
  { slug: 'css', name: 'CSS' },
]

describe('FilterBar', () => {
  it('toggles a tag', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()

    render(
      <FilterBar tags={TAGS} selected={[]} onToggle={onToggle} onClear={vi.fn()} />,
    )

    await user.click(screen.getByRole('button', { name: 'CSS' }))

    expect(onToggle).toHaveBeenCalledWith('css')
  })

  it('shows the clear action only with a selection and clears it', async () => {
    const user = userEvent.setup()
    const onClear = vi.fn()

    const { rerender } = render(
      <FilterBar tags={TAGS} selected={[]} onToggle={vi.fn()} onClear={onClear} />,
    )
    expect(screen.queryByRole('button', { name: 'Limpar tudo' })).not.toBeInTheDocument()

    rerender(
      <FilterBar
        tags={TAGS}
        selected={['react']}
        onToggle={vi.fn()}
        onClear={onClear}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Limpar tudo' }))
    expect(onClear).toHaveBeenCalledTimes(1)
  })
})
