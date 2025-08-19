import { useEffect } from 'react'
import { useTaskStore } from '../stores/taskStore'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import DashboardCalendar from '../components/calendar/DashboardCalendar'

const CalendarPage = () => {
  const { loading, tasks, fetchTasks } = useTaskStore()

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lịch công việc</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Double-click vào ngày để xem chi tiết công việc
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <DashboardCalendar tasks={tasks} />
      </div>
    </div>
  )
}

export default CalendarPage