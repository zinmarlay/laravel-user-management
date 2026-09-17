import { useCallback, useEffect, useRef, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import UserListPagination from '../components/users/UserListPagination'
import { EmptyState, ErrorState, LoadingState } from '../components/users/UserListStatus'
import UserSearchForm from '../components/users/UserSearchForm'
import UserTable from '../components/users/UserTable'
import { fetchUsers } from '../services/usersApi'
import '../App.css'

function UserListPage() {
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState({ search: '', page: 1 })
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [retryKey, setRetryKey] = useState(0)
  const requestId = useRef(0)

  const retry = useCallback(() => {
    setLoading(true)
    setError(null)
    setRetryKey((current) => current + 1)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const currentRequestId = requestId.current + 1
    requestId.current = currentRequestId

    fetchUsers({
      search: query.search,
      page: query.page,
      signal: controller.signal,
    })
      .then((nextResult) => {
        if (requestId.current !== currentRequestId) {
          return
        }

        setResult(nextResult)
      })
      .catch((requestError) => {
        if (controller.signal.aborted || requestId.current !== currentRequestId) {
          return
        }

        if (requestError.code === 'unauthenticated') {
          setResult(null)
        }
        setError(requestError)
      })
      .finally(() => {
        if (requestId.current === currentRequestId) {
          setLoading(false)
        }
      })

    return () => controller.abort()
  }, [query, retryKey])

  function handleSearchSubmit(event) {
    event.preventDefault()
    const nextSearch = searchInput.trim()

    setLoading(true)
    setError(null)
    setQuery(() => ({
      search: nextSearch,
      page: 1,
    }))
    setRetryKey((current) => current + 1)
  }

  function handlePageChange(_event, nextPage) {
    setLoading(true)
    setError(null)
    setQuery((currentQuery) => ({
      ...currentQuery,
      page: nextPage,
    }))
  }

  const hasRows = Boolean(result?.rows?.length)
  const showInitialLoading = loading && !result
  const showTable = result && hasRows
  const showInlineError = Boolean(error && result)

  return (
    <main className="user-list-page">
      <Box className="user-list-page__content">
        <Typography className="user-list-page__title" component="h1" variant="h3">
          Users
        </Typography>

        <Paper className="user-list-page__surface" elevation={0}>
          <UserSearchForm
            value={searchInput}
            onChange={setSearchInput}
            onSubmit={handleSearchSubmit}
            disabled={loading}
          />

          {showInlineError && (
            <Alert
              className="user-list-page__feedback"
              action={
                <Button color="inherit" size="small" onClick={retry}>
                  Retry
                </Button>
              }
              severity={error.code === 'unauthenticated' ? 'warning' : 'error'}
            >
              {error.message}
            </Alert>
          )}

          {showInitialLoading && <LoadingState />}

          {!loading && !result && error && (
            <ErrorState error={error} onRetry={retry} />
          )}

          {!loading && result && !error && !hasRows && (
            <EmptyState searched={Boolean(query.search)} />
          )}

          {showTable && (
            <Box className="user-list-page__table-wrap">
              <UserTable users={result.rows} />
              {loading && <LoadingState overlay />}
            </Box>
          )}

          {result && !error && hasRows && (
            <UserListPagination
              page={result.currentPage}
              count={result.lastPage}
              onChange={handlePageChange}
              disabled={loading}
            />
          )}
        </Paper>
      </Box>
    </main>
  )
}

export default UserListPage
