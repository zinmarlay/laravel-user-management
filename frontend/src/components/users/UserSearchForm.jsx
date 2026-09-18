import Button from '@mui/material/Button'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import SearchIcon from '@mui/icons-material/Search'
import { useTranslation } from '../../i18n/LanguageContext'

function UserSearchForm({ value, onChange, onSubmit, disabled }) {
  const { t } = useTranslation()

  return (
    <form className="user-list-page__search" onSubmit={onSubmit} role="search">
      <TextField
        className="user-list-page__search-field"
        fullWidth
        label={t('users.searchLabel')}
        placeholder={t('users.searchPlaceholder')}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
          htmlInput: {
            'aria-label': t('users.searchAccessible'),
          },
        }}
      />
      <Button
        className="user-list-page__search-button"
        type="submit"
        variant="contained"
        disabled={disabled}
        startIcon={<SearchIcon />}
      >
        {t('users.search')}
      </Button>
    </form>
  )
}

export default UserSearchForm
