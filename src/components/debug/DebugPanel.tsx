import { useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { useTaskStore } from '../../stores/taskStore'
import { checkFirebaseConfig } from '../../utils/debug'
import { Priority, TaskStatus } from '../../types'

const DebugPanel = () => {
  const { user } = useAuthStore()
  const { tasks, loading, error, createTask } = useTaskStore()
  const [showDebug, setShowDebug] = useState(false)
  const [testLoading, setTestLoading] = useState(false)

  const testCreateTask = async () => {
    if (!user) {
      alert('No user logged in!')
      return
    }

    setTestLoading(true)
    try {
      await createTask(user.uid, {
        title: `Test Task ${Date.now()}`,
        description: 'This is a test task created from debug panel',
        priority: Priority.MEDIUM,
        status: TaskStatus.TODO,
        isCompleted: false,
      })
      alert('Test task created successfully!')
    } catch (error: any) {
      alert(`Failed to create test task: ${error.message}`)
    } finally {
      setTestLoading(false)
    }
  }

  const firebaseConfigOk = checkFirebaseConfig()

  if (!showDebug) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setShowDebug(true)}
          className="bg-red-500 text-white px-3 py-2 rounded-lg text-sm"
        >
          Debug
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4 max-w-sm shadow-lg">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-sm">Debug Panel</h3>
        <button
          onClick={() => setShowDebug(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 text-xs">
        <div>
          <strong>Firebase Config:</strong>{' '}
          <span className={firebaseConfigOk ? 'text-green-600' : 'text-red-600'}>
            {firebaseConfigOk ? '✓ OK' : '✗ Missing'}
          </span>
        </div>

        <div>
          <strong>User:</strong>{' '}
          <span className={user ? 'text-green-600' : 'text-red-600'}>
            {user ? `✓ ${user.email}` : '✗ Not logged in'}
          </span>
        </div>

        <div>
          <strong>Tasks:</strong> {tasks.length} loaded
        </div>

        <div>
          <strong>Loading:</strong>{' '}
          <span className={loading ? 'text-yellow-600' : 'text-green-600'}>
            {loading ? 'Yes' : 'No'}
          </span>
        </div>

        {error && (
          <div>
            <strong>Error:</strong>{' '}
            <span className="text-red-600 break-words">{error}</span>
          </div>
        )}

        <div className="pt-2 border-t">
          <button
            onClick={testCreateTask}
            disabled={testLoading || !user}
            className="w-full bg-blue-500 text-white px-3 py-1 rounded text-xs disabled:opacity-50"
          >
            {testLoading ? 'Creating...' : 'Test Create Task'}
          </button>
        </div>

        <div className="text-xs text-gray-500">
          Check browser console for detailed logs
        </div>
      </div>
    </div>
  )
}

export default DebugPanel