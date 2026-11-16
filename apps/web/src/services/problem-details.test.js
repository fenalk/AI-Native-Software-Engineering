import { describe, expect, it } from 'vitest'
import { toFieldErrors, toProblemDetails } from './problem-details.js'

function responseError(data, status) {
  return { isAxiosError: true, response: { data, status } }
}

describe('toProblemDetails', () => {
  it('reads an RFC 9457 body returned by the API', () => {
    const problem = toProblemDetails(
      responseError(
        {
          type: 'about:blank',
          title: 'Conflict',
          status: 409,
          detail: 'Email already registered',
          instance: '/users',
        },
        409,
      ),
    )

    expect(problem).toEqual({
      title: 'Conflict',
      detail: 'Email already registered',
      status: 409,
      errors: [],
    })
  })

  it('keeps validation issues', () => {
    const problem = toProblemDetails(
      responseError(
        {
          title: 'Bad Request',
          status: 400,
          detail: 'The request payload is invalid.',
          errors: [{ path: 'email', message: 'Invalid email address' }],
        },
        400,
      ),
    )

    expect(problem.errors).toEqual([
      { path: 'email', message: 'Invalid email address' },
    ])
  })

  it('falls back to a connection message when there is no response', () => {
    const problem = toProblemDetails(new Error('Network Error'))

    expect(problem.status).toBeNull()
    expect(problem.title).toBe('Sem conexão')
    expect(problem.errors).toEqual([])
  })

  it('falls back when the body is not a problem details document', () => {
    const problem = toProblemDetails(responseError('Internal Server Error', 500))

    expect(problem.status).toBe(500)
    expect(problem.title).toBe('Erro inesperado')
    expect(problem.detail).toMatch(/Tente novamente/)
  })
})

describe('toFieldErrors', () => {
  it('maps only the fields the forms render', () => {
    const fieldErrors = toFieldErrors({
      errors: [
        { path: 'email', message: 'Invalid email address' },
        { path: 'password', message: 'Too small' },
        { path: 'createdAt', message: 'Unexpected' },
        { path: 'profile.name', message: 'Ignored nested issue' },
      ],
    })

    expect(fieldErrors).toEqual({
      email: 'Invalid email address',
      password: 'Too small',
    })
  })

  it('returns an empty object when there are no issues', () => {
    expect(toFieldErrors({ errors: [] })).toEqual({})
    expect(toFieldErrors({})).toEqual({})
  })
})
