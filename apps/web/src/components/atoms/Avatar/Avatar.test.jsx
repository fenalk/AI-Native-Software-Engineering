import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Avatar } from './Avatar.jsx'

describe('Avatar', () => {
  it('renders the image when available', () => {
    const { container } = render(
      <Avatar src="/seed/julio.png" name="Julio" />,
    )

    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      '/seed/julio.png',
    )
  })

  it('falls back to initials when there is no image', () => {
    render(<Avatar name="Ada Lovelace" />)

    expect(screen.getByText('AL')).toBeInTheDocument()
  })

  it('falls back to initials when the image fails', () => {
    const { container } = render(
      <Avatar src="/seed/broken.png" name="Marcela Lins" />,
    )

    fireEvent.error(container.querySelector('img'))

    expect(screen.getByText('ML')).toBeInTheDocument()
  })
})
