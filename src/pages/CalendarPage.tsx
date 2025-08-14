import { useEffect } from 'react'
import { useTaskStore } from '../stores/taskStore'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const CalendarPage = () => {
  const { loading, fetchTasks } = useTaskStore()

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendar</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          Calendar view coming soon...
        </p>
      </div>
    </div>
  )
}

export default CalendarPage