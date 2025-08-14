import { useEffect, useState } from 'react'
import { useTaskStore } from '../stores/taskStore'
import { TaskStatus } from '../types'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ThemeToggle from '../components/ui/ThemeToggle'
import TaskForm from '../components/tasks/TaskForm'
import DashboardCalendar from '../components/calendar/DashboardCalendar'
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  PlusIcon 
} from '@heroicons/react/24/outline'

const DashboardPage = () => {
  const { tasks, loading, fetchTasks } = useTaskStore()
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
  })

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  useEffect(() => {
    const now = new Date()
    const completed = tasks.filter(task => task.status === TaskStatus.COMPLETED).length
    const pending = tasks.filter(task => task.status !== TaskStatus.COMPLETED).length
    const overdue = tasks.filter(task => 
      task.dueDate && 
      task.dueDate < now && 
      task.status !== TaskStatus.COMPLETED
    ).length

    setStats({
      total: tasks.length,
      completed,
      pending,
      overdue,
    })
  }, [tasks])



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
        <div className="flex items-center space-x-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <button 
          onClick={() => setShowTaskForm(true)}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          New Task
        </button>
        </div>
        <ThemeToggle />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tasks</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.overdue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Calendar</h2>
        </div>
        <div className="p-6">
          <DashboardCalendar tasks={tasks} />
        </div>
      </div>

      {showTaskForm && (
        <TaskForm
          onClose={() => setShowTaskForm(false)}
          onSuccess={() => setShowTaskForm(false)}
        />
      )}
    </div>
  )
}

export default DashboardPage