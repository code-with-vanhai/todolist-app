import { useEffect, useState } from 'react'
import { useTaskStore } from '../stores/taskStore'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import TaskList from '../components/tasks/TaskList'
import TaskFilters from '../components/tasks/TaskFilters'
import TaskForm from '../components/tasks/TaskForm'
import { PlusIcon } from '@heroicons/react/24/outline'

const TasksPage = () => {
  const { loading, fetchTasks, cleanup } = useTaskStore()
  const [showTaskForm, setShowTaskForm] = useState(false)

  useEffect(() => {
    fetchTasks()
    
    // Cleanup real-time listener on unmount
    return () => {
      cleanup()
    }
  }, [fetchTasks, cleanup])

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h1>
        <button 
          onClick={() => setShowTaskForm(true)}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          New Task
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <TaskFilters />
        </div>
        <div className="lg:col-span-3">
          <TaskList />
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

export default TasksPage