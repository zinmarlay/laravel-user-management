import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import UserAvatar from './UserAvatar'

function displayValue(value) {
  return value === null || value === undefined || value === '' ? '—' : value
}

function UserTable({ users }) {
  return (
    <TableContainer className="user-list-page__table-container">
      <Table className="user-list-page__table" aria-label="Users">
        <TableHead>
          <TableRow className="user-list-page__table-header">
            <TableCell className="user-list-page__photo-cell" scope="col">
              Photo
            </TableCell>
            <TableCell scope="col">Name</TableCell>
            <TableCell scope="col">Email</TableCell>
            <TableCell scope="col">Role</TableCell>
            <TableCell scope="col">Address</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="user-list-page__photo-cell">
                <UserAvatar name={user.name} photo={user.photo} />
              </TableCell>
              <TableCell className="user-list-page__name-cell">
                {displayValue(user.name)}
              </TableCell>
              <TableCell className="user-list-page__email-cell">
                {displayValue(user.email)}
              </TableCell>
              <TableCell className="user-list-page__role-cell">
                {displayValue(user.role)}
              </TableCell>
              <TableCell className="user-list-page__address-cell">
                {displayValue(user.address)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default UserTable
