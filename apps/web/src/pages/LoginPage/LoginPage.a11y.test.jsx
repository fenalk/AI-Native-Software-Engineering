import { render } from '@testing-library/react'
import { describe, it } from 'vitest'
import { expectNoA11yViolations } from '../../test/a11y.js'
import { LoginPage } from './LoginPage.jsx'

describe('LoginPage (accessibility)', () => {
  it('has no WCAG 2.2 AA violations', async () => {
    const { container } = render(<LoginPage />)

    await expectNoA11yViolations(container)
  })
})
