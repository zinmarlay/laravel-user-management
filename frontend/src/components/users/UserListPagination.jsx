import Pagination from '@mui/material/Pagination'

function UserListPagination({ page, count, onChange, disabled }) {
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
        aria-label="User list pagination"
      />
    </div>
  )
}

export default UserListPagination
