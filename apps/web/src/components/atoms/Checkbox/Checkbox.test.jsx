import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Checkbox } from './Checkbox.jsx'

function ControlledCheckbox({ onChange }) {
  const [checked, setChecked] = useState(false)

  return (
    <Checkbox
      id="lembrar"
      label="Lembrar-me"
      checked={checked}
      onChange={(event) => {
        setChecked(event.target.checked)
        onChange(event)
      }}
    />
  )
}

describe('Checkbox', () => {
  it('toggles through its label and reports the new state', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ControlledCheckbox onChange={onChange} />)

    const checkbox = screen.getByRole('checkbox', { name: 'Lembrar-me' })
    expect(checkbox).not.toBeChecked()

    await user.click(screen.getByText('Lembrar-me'))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(checkbox).toBeChecked()
  })
})
