import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTranslation } from '../../i18n/LanguageContext'
import { getLocalizedErrorMessage } from '../../i18n/errorMessages'

export function LoadingState({ overlay = false }) {
  const { t } = useTranslation()

  if (overlay) {
    return (
      <Box
        className="user-list-page__loading-overlay"
        role="status"
        aria-live="polite"
      >
        <Stack sx={{ alignItems: 'center' }} spacing={1}>
          <CircularProgress size={32} />
          <Typography variant="body2">{t('users.loading')}</Typography>
        </Stack>
      </Box>
    )
  }

  return (
    <Box className="user-list-page__status" role="status" aria-live="polite">
      <Stack className="user-list-page__status-copy" spacing={2} sx={{ alignItems: 'center' }}>
        <CircularProgress size={36} />
        <Typography>{t('users.loading')}</Typography>
      </Stack>
    </Box>
  )
}

export function EmptyState({ searched }) {
  const { t } = useTranslation()

  return (
    <Box className="user-list-page__status">
      <Stack className="user-list-page__status-copy" spacing={1}>
        <Typography variant="h6">
          {searched ? t('users.noSearchResults') : t('users.noUsers')}
        </Typography>
        <Typography color="text.secondary" variant="body2">
          {searched
            ? t('users.tryDifferentSearch')
            : t('users.noUsersYet')}
        </Typography>
      </Stack>
    </Box>
  )
}

export function ErrorState({ error, onRetry }) {
  const { t } = useTranslation()

  return (
    <Box className="user-list-page__status">
      <Alert
        action={
          <Button color="inherit" size="small" onClick={onRetry}>
            {t('common.retry')}
          </Button>
        }
        severity={error?.code === 'unauthenticated' ? 'warning' : 'error'}
      >
        {getLocalizedErrorMessage(error, t, 'errors.loadUsers')}
      </Alert>
    </Box>
  )
}
