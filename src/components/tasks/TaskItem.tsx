import React, { useState, useCallback, useMemo } from 'react'
import { Task, Priority, TaskStatus } from '../../types'
import { useTaskStore } from '../../stores/taskStore'
import { useAuthStore } from '../../stores/authStore'
import { useGroupStore } from '../../stores/groupStore'
import TaskForm from './TaskForm'
import { useConfirm } from '../ui/ConfirmDialog'
import { useToast } from '../ui/Toast'
import {
  CheckCircleIcon,
  ClockIcon,
  TrashIcon,
  PencilIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid'

interface TaskItemProps {
  task: Task
}

// Memoize color functions outside component to avoid recreation
const getPriorityColor = (priority: Priority) => {
  switch (priority) {
    case Priority.URGENT:
      return 'text-red-600 bg-red-100 border-red-200'
    case Priority.HIGH:
      return 'text-orange-600 bg-orange-100 border-orange-200'
    case Priority.MEDIUM:
      return 'text-yellow-600 bg-yellow-100 border-yellow-200'
    case Priority.LOW:
      return 'text-green-600 bg-green-100 border-green-200'
    default:
      return 'text-gray-600 bg-gray-100 border-gray-200'
  }
}

const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.COMPLETED:
      return 'text-green-600 bg-green-100'
    case TaskStatus.IN_PROGRESS:
      return 'text-blue-600 bg-blue-100'
    case TaskStatus.TODO:
      return 'text-gray-600 bg-gray-100'
    case TaskStatus.CANCELLED:
      return 'text-red-600 bg-red-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

const TaskItem: React.FC<TaskItemProps> = React.memo(({ task }) => {
  const { user } = useAuthStore()
  const { toggleTaskCompletion, deleteTask } = useTaskStore()
  const { getGroupById, getDefaultGroup } = useGroupStore()
  const [loading, setLoading] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const { confirm, ConfirmComponent } = useConfirm()
  const { showToast } = useToast()

  const group = task.groupId ? getGroupById(task.groupId) : getDefaultGroup()

  // Memoize computed values
  const isOverdue = useMemo(() =>
    task.dueDate && task.dueDate < new Date() && !task.isCompleted,
    [task.dueDate, task.isCompleted]
  )

  const priorityColor = useMemo(() =>
    getPriorityColor(task.priority),
    [task.priority]
  )

  const statusColor = useMemo(() =>
    getStatusColor(task.status),
    [task.status]
  )

  const handleToggleCompletion = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const newCompletionState = !task.isCompleted
    console.log('🔄 Toggling task completion:', {
      taskId: task.id,
      title: task.title,
      currentState: task.isCompleted,
      newState: newCompletionState,
      isOverdue: isOverdue,
      dueDate: task.dueDate,
      status: task.status
    })

    try {
      await toggleTaskCompletion(user.uid, task.id, newCompletionState)
      showToast(
        task.isCompleted ? 'Đã đánh dấu task chưa hoàn thành' : 'Đã hoàn thành task!',
        'success'
      )
    } catch (error: any) {
      console.error('❌ Error toggling task completion:', error)
      showToast(`Có lỗi xảy ra: ${error.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }, [user, task.id, task.title, task.isCompleted, isOverdue, task.dueDate, task.status, toggleTaskCompletion, showToast])

  const handleDelete = useCallback(() => {
    if (!user) return

    confirm(
      'Xóa task',
      `Bạn có chắc chắn muốn xóa task "${task.title}"?`,
      async () => {
        setLoading(true)
        try {
          await deleteTask(user.uid, task.id)
          showToast('Đã xóa task thành công', 'success')
        } catch (error: any) {
          showToast('Có lỗi xảy ra khi xóa task', 'error')
        } finally {
          setLoading(false)
        }
      },
      'danger',
      'Xóa task'
    )
  }, [user, task.id, task.title, confirm, deleteTask, showToast])

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow border-l-4 p-6 ${
      task.isCompleted ? 'border-green-500' : 
      isOverdue ? 'border-red-500' : 
      'border-gray-300'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <button
            onClick={handleToggleCompletion}
            disabled={loading}
            className="mt-1 text-gray-400 hover:text-green-600 transition-colors"
            aria-label={task.isCompleted ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu hoàn thành'}
          >
            {task.isCompleted ? (
              <CheckCircleIconSolid className="w-6 h-6 text-green-600" />
            ) : (
              <CheckCircleIcon className="w-6 h-6" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <h3 className={`text-lg font-medium ${
              task.isCompleted 
                ? 'text-gray-500 line-through' 
                : 'text-gray-900 dark:text-white'
            }`}>
              {task.title}
            </h3>
            
            {task.description && (
              <p className={`mt-1 text-sm ${
                task.isCompleted 
                  ? 'text-gray-400' 
                  : 'text-gray-600 dark:text-gray-300'
              }`}>
                {task.description}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${priorityColor}`}>
                {task.priority}
              </span>

              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                {task.status.replace('-', ' ')}
              </span>

              {task.dueDate && (
                <div className={`flex items-center text-xs ${
                  isOverdue ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {isOverdue && <ExclamationTriangleIcon className="w-4 h-4 mr-1" />}
                  <ClockIcon className="w-4 h-4 mr-1" />
                  Due: {task.dueDate.toLocaleDateString()}
                </div>
              )}

              {group && (
                <div className="flex items-center text-xs text-gray-500">
                  <span className="mr-1">{group.icon}</span>
                  <span>{group.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={() => setShowEditForm(true)}
            className="text-gray-400 hover:text-blue-600 transition-colors"
            aria-label="Chỉnh sửa task"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="text-gray-400 hover:text-red-600 transition-colors"
            aria-label="Xóa task"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {showEditForm && (
        <TaskForm
          task={task}
          onClose={() => setShowEditForm(false)}
          onSuccess={() => {
            setShowEditForm(false)
            showToast('Cập nhật task thành công', 'success')
          }}
        />
      )}
      <ConfirmComponent />
    </div>
  )
})

export default TaskItem