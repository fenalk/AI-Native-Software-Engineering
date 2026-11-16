import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PostThumbnail } from './PostThumbnail.jsx'

describe('PostThumbnail', () => {
  it('renders the image when a source is provided', () => {
    render(<PostThumbnail src="/seed/feed-01.png" alt="Prévia do post" />)

    expect(screen.getByAltText('Prévia do post')).toHaveAttribute(
      'src',
      '/seed/feed-01.png',
    )
  })

  it('renders the placeholder when there is no thumbnail', () => {
    render(<PostThumbnail src={null} />)

    expect(
      screen.getByRole('img', { name: 'Post sem imagem de prévia' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Sem prévia')).toBeInTheDocument()
  })

  it('falls back to the placeholder when the image fails to load', () => {
    render(<PostThumbnail src="/seed/broken.png" alt="Prévia do post" />)

    fireEvent.error(screen.getByAltText('Prévia do post'))

    expect(
      screen.getByRole('img', { name: 'Post sem imagem de prévia' }),
    ).toBeInTheDocument()
  })
})
