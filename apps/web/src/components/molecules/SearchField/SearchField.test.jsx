import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SearchField } from './SearchField.jsx'

describe('SearchField', () => {
  it('reports every change', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<SearchField value="" onChange={onChange} />)

    await user.type(screen.getByLabelText('Buscar posts'), 'react')

    expect(onChange).toHaveBeenCalledTimes(5)
  })
})
