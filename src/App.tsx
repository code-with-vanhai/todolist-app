import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './stores/authStore'
import { auth } from './services/firebase'
import { onAuthStateChanged } from 'firebase/auth'

// Pages
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import TasksPage from './pages/TasksPage'
import CalendarPage from './pages/CalendarPage'

// Components
import Layout from './components/ui/Layout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import LoadingSpinner from './components/ui/LoadingSpinner'
import DebugPanel from './components/debug/DebugPanel'

function App() {
  const { setUser, setLoading, loading } = useAuthStore()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser({
          uid: user.uid,
          email: user.email!,
          displayName: user.displayName || undefined,
          photoURL: user.photoURL || undefined,
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [setUser, setLoading])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/tasks" element={<TasksPage />} />
                    <Route path="/calendar" element={<CalendarPage />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
        <DebugPanel />
      </div>
    </Router>
  )
}

export default App