import { useCallback, useState } from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import UserProfilePage from './pages/UserProfilePage'
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
  const [authScreen, setAuthScreen] = useState('login')
  const [activePage, setActivePage] = useState('users')
  const [profileUserId, setProfileUserId] = useState(null)
  const [userListRefreshKey, setUserListRefreshKey] = useState(0)
  const [authNotice, setAuthNotice] = useState('')

  const handleAuthenticated = useCallback((response) => {
    try {
      window.localStorage.setItem('token', response.token)
    } catch {
      throw new Error('Unable to save the sign-in session.')
    }

    setAuthenticated(true)
    setCurrentUser(getSafeCurrentUser(response?.user))
    setAuthScreen('login')
    setAuthNotice('')
    setActivePage('users')
    setProfileUserId(null)
  }, [])

  const handleUnauthenticated = useCallback((notice = '') => {
    try {
      window.localStorage.removeItem('token')
    } catch {
      // The in-memory auth state still prevents access to protected content.
    }

    setCurrentUser(null)
    setAuthenticated(false)
    setAuthScreen('login')
    setAuthNotice(typeof notice === 'string' ? notice : '')
    setActivePage('users')
    setProfileUserId(null)
  }, [])

  const handleLogout = useCallback(() => {
    try {
      window.localStorage.removeItem('token')
    } catch {
      // The in-memory auth state still prevents access to protected content.
    }

    setCurrentUser(null)
    setAuthenticated(false)
    setAuthScreen('login')
    setAuthNotice('')
    setActivePage('users')
    setProfileUserId(null)
  }, [])

  const handleViewProfile = useCallback((user) => {
    if (user?.id === null || user?.id === undefined) {
      return
    }

    setProfileUserId(user.id)
    setActivePage('profile')
  }, [])

  const handleBackToUsers = useCallback(() => {
    setActivePage('users')
  }, [])

  const handleCurrentUserUpdated = useCallback((user) => {
    setUserListRefreshKey((current) => current + 1)

    setCurrentUser((current) => {
      if (!current || String(current.id) !== String(user?.id)) {
        return current
      }

      return getSafeCurrentUser(user)
    })
  }, [])

  const handleShowRegister = useCallback(() => {
    setAuthScreen('register')
  }, [])

  const handleShowLogin = useCallback(() => {
    setAuthScreen('login')
  }, [])

  return (
    <>
      <CssBaseline />
      {authenticated ? (
        <>
          <div hidden={activePage !== 'users'}>
            <UserListPage
              currentUser={currentUser}
              onLogout={handleLogout}
              onUnauthenticated={handleUnauthenticated}
              onViewProfile={handleViewProfile}
              refreshKey={userListRefreshKey}
            />
          </div>
          {activePage === 'profile' && (
            <UserProfilePage
              userId={profileUserId}
              currentUser={currentUser}
              onBack={handleBackToUsers}
              onCurrentUserUpdated={handleCurrentUserUpdated}
              onUnauthenticated={handleUnauthenticated}
            />
          )}
        </>
      ) : (
        authScreen === 'register' ? (
          <RegisterPage
            onAuthenticated={handleAuthenticated}
            onLogin={handleShowLogin}
          />
        ) : (
          <LoginPage
            onAuthenticated={handleAuthenticated}
            onRegister={handleShowRegister}
            notice={authNotice}
          />
        )
      )}
    </>
  )
}

export default App
