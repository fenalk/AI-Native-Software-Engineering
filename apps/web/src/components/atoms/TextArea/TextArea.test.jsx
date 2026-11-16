import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TextArea } from './TextArea.jsx'

describe('TextArea', () => {
  it('reports changes and marks invalid fields', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <TextArea
        id="content"
        name="content"
        value=""
        onChange={onChange}
        invalid
        describedBy="content-error"
      />,
    )

    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveAttribute('aria-invalid', 'true')
    expect(textarea).toHaveAttribute('aria-describedby', 'content-error')

    await user.type(textarea, 'const x = 1')
    expect(onChange).toHaveBeenCalled()
  })
})
