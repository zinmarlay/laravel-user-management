const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')

export class UsersApiError extends Error {
  constructor(message, { status = 0, code = 'unknown', payload = null } = {}) {
    super(message)
    this.name = 'UsersApiError'
    this.status = status
    this.code = code
    this.payload = payload
  }
}

function getUsersEndpoint() {
  return `${API_BASE_URL}/api/users`
}

function getStoredToken() {
  try {
    return window.localStorage.getItem('token') || ''
  } catch {
    return ''
  }
}

function getErrorForStatus(status, payload) {
  if (status === 401) {
    return new UsersApiError(
      'Your session has expired. Please sign in again.',
      { status, code: 'unauthenticated', payload },
    )
  }

  if (status === 403) {
    return new UsersApiError(
      'You are not authorized to view users.',
      { status, code: 'forbidden', payload },
    )
  }

  return new UsersApiError(
    'We could not load users. Please try again.',
    { status, code: 'request-failed', payload },
  )
}

function isListEmptyResponse(response, payload) {
  return (
    response.status === 404 &&
    payload &&
    payload.message === 'User not found.'
  )
}

function normalizePaginator(payload) {
  if (
    !payload ||
    !Array.isArray(payload.data) ||
    payload.data.some(
      (user) => !user || typeof user !== 'object' || Array.isArray(user),
    ) ||
    !Number.isInteger(payload.current_page) ||
    !Number.isInteger(payload.last_page) ||
    payload.current_page < 1 ||
    payload.last_page < 1
  ) {
    throw new UsersApiError(
      'The users response was not in the expected format.',
      { code: 'invalid-response', payload },
    )
  }

  return {
    rows: payload.data,
    currentPage: payload.current_page,
    lastPage: payload.last_page,
    total: Number.isInteger(payload.total) ? payload.total : payload.data.length,
    perPage: Number.isInteger(payload.per_page) ? payload.per_page : 5,
  }
}

export async function fetchUsers({ search = '', page = 1, token, signal } = {}) {
  const params = new URLSearchParams({ page: String(page) })
  if (search) {
    params.set('search', search)
  }

  const headers = {
    Accept: 'application/json',
  }
  const authToken = token ?? getStoredToken()
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`
  }

  let response
  let payload

  try {
    response = await fetch(`${getUsersEndpoint()}?${params.toString()}`, {
      headers,
      signal,
    })
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error
    }

    throw new UsersApiError(
      'We could not connect to the server. Please try again.',
      { code: 'network' },
    )
  }

  try {
    payload = await response.json()
  } catch {
    if (!response.ok) {
      throw getErrorForStatus(response.status, null)
    }

    throw new UsersApiError(
      'The users response was not valid JSON.',
      { status: response.status, code: 'invalid-response' },
    )
  }

  if (isListEmptyResponse(response, payload)) {
    return {
      rows: [],
      currentPage: 1,
      lastPage: 1,
      total: 0,
      perPage: 5,
    }
  }

  if (!response.ok) {
    throw getErrorForStatus(response.status, payload)
  }

  return normalizePaginator(payload)
}
