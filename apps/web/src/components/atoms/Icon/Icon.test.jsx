import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Icon } from './Icon.jsx'

describe('Icon', () => {
  it('renders the ligature and hides it from assistive tech', () => {
    const { container } = render(<Icon name="favorite" />)

    expect(container.firstChild).toHaveTextContent('favorite')
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('exposes a label when the icon carries meaning', () => {
    render(<Icon name="favorite" label="Curtir" />)

    expect(screen.getByRole('img', { name: 'Curtir' })).toBeInTheDocument()
  })
})
