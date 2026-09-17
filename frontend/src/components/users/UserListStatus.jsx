import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

export function LoadingState({ overlay = false }) {
  if (overlay) {
    return (
      <Box
        className="user-list-page__loading-overlay"
        role="status"
        aria-live="polite"
      >
        <Stack sx={{ alignItems: 'center' }} spacing={1}>
          <CircularProgress size={32} />
          <Typography variant="body2">Loading users…</Typography>
        </Stack>
      </Box>
    )
  }

  return (
    <Box className="user-list-page__status" role="status" aria-live="polite">
      <Stack className="user-list-page__status-copy" spacing={2} sx={{ alignItems: 'center' }}>
        <CircularProgress size={36} />
        <Typography>Loading users…</Typography>
      </Stack>
    </Box>
  )
}

export function EmptyState({ searched }) {
  return (
    <Box className="user-list-page__status">
      <Stack className="user-list-page__status-copy" spacing={1}>
        <Typography variant="h6">
          {searched ? 'No users found for your search.' : 'No users found.'}
        </Typography>
        <Typography color="text.secondary" variant="body2">
          {searched
            ? 'Try a different name or email, or clear your search.'
            : 'There are no users to display yet.'}
        </Typography>
      </Stack>
    </Box>
  )
}

export function ErrorState({ error, onRetry }) {
  return (
    <Box className="user-list-page__status">
      <Alert
        action={
          <Button color="inherit" size="small" onClick={onRetry}>
            Retry
          </Button>
        }
        severity={error?.code === 'unauthenticated' ? 'warning' : 'error'}
      >
        {error?.message || 'We could not load users. Please try again.'}
      </Alert>
    </Box>
  )
}
