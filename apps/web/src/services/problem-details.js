const CONNECTION_PROBLEM = {
  title: 'Sem conexão',
  detail:
    'Não foi possível falar com o servidor. Verifique sua conexão e tente novamente.',
  status: null,
  errors: [],
}

const INVALID_RESPONSE_PROBLEM = {
  title: 'Erro inesperado',
  detail: 'O servidor retornou uma resposta inesperada. Tente novamente.',
  status: null,
  errors: [],
}

const VALIDATION_FIELDS = new Set(['name', 'email', 'password'])

function isRecord(value) {
  return typeof value === 'object' && value !== null
}

/**
 * Normalizes an axios error into the RFC 9457 problem details shape served by
 * the API, with a Portuguese fallback for transport failures.
 */
export function toProblemDetails(error) {
  const response = error?.response

  if (!isRecord(response)) {
    return { ...CONNECTION_PROBLEM }
  }

  const body = response.data
  const status =
    isRecord(body) && typeof body.status === 'number'
      ? body.status
      : (response.status ?? null)

  if (!isRecord(body) || typeof body.title !== 'string') {
    return { ...INVALID_RESPONSE_PROBLEM, status }
  }

  return {
    title: body.title,
    detail:
      typeof body.detail === 'string' && body.detail.length > 0
        ? body.detail
        : body.title,
    status,
    errors: Array.isArray(body.errors) ? body.errors : [],
  }
}

/**
 * Extracts per-field validation messages from a problem details body, ignoring
 * issues for properties the forms do not show.
 */
export function toFieldErrors(problem, fields = VALIDATION_FIELDS) {
  const fieldErrors = {}

  for (const issue of problem?.errors ?? []) {
    const path =
      typeof issue?.path === 'string' ? issue.path.split('.')[0] : undefined

    if (path && fields.has(path) && typeof issue.message === 'string') {
      fieldErrors[path] = issue.message
    }
  }

  return fieldErrors
}
