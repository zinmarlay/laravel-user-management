import Button from '@mui/material/Button'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import SearchIcon from '@mui/icons-material/Search'

function UserSearchForm({ value, onChange, onSubmit, disabled }) {
  return (
    <form className="user-list-page__search" onSubmit={onSubmit} role="search">
      <TextField
        className="user-list-page__search-field"
        fullWidth
        label="Search users"
        placeholder="Search by name or email"
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
            'aria-label': 'Search users by name or email',
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
        Search
      </Button>
    </form>
  )
}

export default UserSearchForm
