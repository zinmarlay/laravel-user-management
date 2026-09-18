import Pagination from '@mui/material/Pagination'
import { useTranslation } from '../../i18n/LanguageContext'

function UserListPagination({ page, count, onChange, disabled }) {
  const { t } = useTranslation()

  if (count <= 1) {
    return null
  }

  return (
    <div className="user-list-page__pagination">
      <Pagination
        page={page}
        count={count}
        color="primary"
        shape="rounded"
        disabled={disabled}
        onChange={onChange}
        aria-label={t('users.pagination')}
      />
    </div>
  )
}

export default UserListPagination
