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

function getSafeCurrentUser(user) {
  if (!user || typeof user !== 'object' || Array.isArray(user)) {
    return null
  }

  return {
    id: user.id ?? null,
    name: typeof user.name === 'string' ? user.name : '',
    email: typeof user.email === 'string' ? user.email : '',
    role: typeof user.role === 'string' ? user.role : '',
  }
}

function App() {
  const [authenticated, setAuthenticated] = useState(hasStoredToken)
  const [currentUser, setCurrentUser] = useState(null)

  const handleAuthenticated = useCallback((response) => {
    try {
      window.localStorage.setItem('token', response.token)
    } catch {
      throw new Error('Unable to save the sign-in session.')
    }

    setAuthenticated(true)
    setCurrentUser(getSafeCurrentUser(response?.user))
  }, [])

  const handleUnauthenticated = useCallback(() => {
    try {
      window.localStorage.removeItem('token')
    } catch {
      // The in-memory auth state still prevents access to protected content.
    }

    setCurrentUser(null)
    setAuthenticated(false)
  }, [])

  const handleLogout = useCallback(() => {
    try {
      window.localStorage.removeItem('token')
    } catch {
      // The in-memory auth state still prevents access to protected content.
    }

    setCurrentUser(null)
    setAuthenticated(false)
  }, [])

  return (
    <>
      <CssBaseline />
      {authenticated ? (
        <UserListPage
          currentUser={currentUser}
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
