import { useCallback, useState } from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import LoginPage from './pages/LoginPage'
import UserListPage from './pages/UserListPage'

function hasStoredToken() {
  try {
    return Boolean(window.localStorage.getItem('token')?.trim())
  } catch {
    return false
  }
}

function App() {
  const [authenticated, setAuthenticated] = useState(hasStoredToken)

  const handleAuthenticated = useCallback((response) => {
    try {
      window.localStorage.setItem('token', response.token)
    } catch {
      throw new Error('Unable to save the sign-in session.')
    }

    setAuthenticated(true)
  }, [])

  const handleUnauthenticated = useCallback(() => {
    try {
      window.localStorage.removeItem('token')
    } catch {
      // The in-memory auth state still prevents access to protected content.
    }

    setAuthenticated(false)
  }, [])

  const handleLogout = useCallback(() => {
    try {
      window.localStorage.removeItem('token')
    } catch {
      // The in-memory auth state still prevents access to protected content.
    }

    setAuthenticated(false)
  }, [])

  return (
    <>
      <CssBaseline />
      {authenticated ? (
        <UserListPage
          onLogout={handleLogout}
          onUnauthenticated={handleUnauthenticated}
        />
      ) : (
        <LoginPage onAuthenticated={handleAuthenticated} />
      )}
    </>
  )
}

export default App
