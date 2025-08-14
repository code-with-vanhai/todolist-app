import { useState, useEffect } from 'react'
import { Task, Priority, TaskStatus } from '../../types'
import { useTaskStore } from '../../stores/taskStore'
import { useAuthStore } from '../../stores/authStore'
import { useGroupStore } from '../../stores/groupStore'
import { XMarkIcon } from '@heroicons/react/24/outline'
import LoadingSpinner from '../ui/LoadingSpinner'
import { debugLog, debugError } from '../../utils/debug'

interface TaskFormProps {
  task?: Task
  onClose: () => void
  onSuccess?: () => void
}

const TaskForm: React.FC<TaskFormProps> = ({ task, onClose, onSuccess }) => {
  const { user } = useAuthStore()
  const { createTask, updateTask } = useTaskStore()
  const { groups, fetchGroups, getDefaultGroup } = useGroupStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    startDate: task?.startDate ? task.startDate.toISOString().split('T')[0] : '',
    dueDate: task?.dueDate ? task.dueDate.toISOString().split('T')[0] : '',
    priority: task?.priority || Priority.MEDIUM,
    status: task?.status || TaskStatus.TODO,
    groupId: task?.groupId || '',
  })

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    debugLog('Form submitted', { user: !!user, formData })
    
    if (!user) {
      setError('User not authenticated')
      debugError('No user found during task creation')
      return
    }

    setLoading(true)
    setError('')

    try {
      const defaultGroup = getDefaultGroup()
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        priority: formData.priority,
        status: formData.status,
        groupId: formData.groupId || defaultGroup.id,
        isCompleted: formData.status === TaskStatus.COMPLETED,
        completedAt: formData.status === TaskStatus.COMPLETED ? new Date() : undefined,
      }

      debugLog('Task data prepared', taskData)

      if (task) {
        debugLog('Updating existing task', task.id)
        await updateTask(user.uid, task.id, taskData)
      } else {
        debugLog('Creating new task for user', user.uid)
        await createTask(user.uid, taskData)
      }

      debugLog('Task operation completed successfully')
      onSuccess?.()
      onClose()
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred'
      debugError('Task creation/update failed', err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {task ? 'Edit Task' : 'Create New Task'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="input-field"
              placeholder="Enter task title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="input-field"
              rows={3}
              placeholder="Enter task description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleChange('dueDate', e.target.value)}
              className="input-field"
              min={formData.startDate || undefined}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => handleChange('priority', e.target.value as Priority)}
              className="input-field"
            >
              <option value={Priority.LOW}>Low</option>
              <option value={Priority.MEDIUM}>Medium</option>
              <option value={Priority.HIGH}>High</option>
              <option value={Priority.URGENT}>Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value as TaskStatus)}
              className="input-field"
            >
              <option value={TaskStatus.TODO}>To Do</option>
              <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
              <option value={TaskStatus.COMPLETED}>Completed</option>
              <option value={TaskStatus.CANCELLED}>Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Group
            </label>
            <select
              value={formData.groupId}
              onChange={(e) => handleChange('groupId', e.target.value)}
              className="input-field"
            >
              <option value="">Default Group</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.icon} {group.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !formData.title.trim()}
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                task ? 'Update Task' : 'Create Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TaskForm