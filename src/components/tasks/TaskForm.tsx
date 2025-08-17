import { useState, useEffect } from 'react'
import { Task, Priority, TaskStatus } from '../../types'
import { useTaskStore } from '../../stores/taskStore'
import { useAuthStore } from '../../stores/authStore'
import { useGroupStore } from '../../stores/groupStore'
import { Modal } from '../ui/Modal'
import { useToast } from '../ui/Toast'
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
  const { showToast } = useToast()

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
      showToast(task ? 'Cập nhật task thành công' : 'Tạo task thành công', 'success')
      onSuccess?.()
      onClose()
    } catch (err: any) {
      const errorMessage = err.message || 'Có lỗi xảy ra'
      debugError('Task creation/update failed', err)
      setError(errorMessage)
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Modal 
      isOpen={true} 
      onClose={onClose} 
      title={task ? 'Chỉnh sửa Task' : 'Tạo Task mới'}
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tiêu đề *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="input-field"
              placeholder="Nhập tiêu đề task"
              maxLength={200}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formData.title.length}/200 ký tự
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mô tả
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="input-field"
              rows={3}
              placeholder="Nhập mô tả task"
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formData.description.length}/1000 ký tự
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ngày bắt đầu
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              className="input-field"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Ngày bắt đầu thực hiện task
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Hạn hoàn thành
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleChange('dueDate', e.target.value)}
              className="input-field"
              min={formData.startDate || undefined}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Ngày cần hoàn thành task
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Độ ưu tiên
            </label>
            <select
              value={formData.priority}
              onChange={(e) => handleChange('priority', e.target.value as Priority)}
              className="input-field"
            >
              <option value={Priority.LOW}>Thấp</option>
              <option value={Priority.MEDIUM}>Trung bình</option>
              <option value={Priority.HIGH}>Cao</option>
              <option value={Priority.URGENT}>Khẩn cấp</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Mức độ quan trọng của task
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Trạng thái
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value as TaskStatus)}
              className="input-field"
            >
              <option value={TaskStatus.TODO}>Chưa làm</option>
              <option value={TaskStatus.IN_PROGRESS}>Đang làm</option>
              <option value={TaskStatus.COMPLETED}>Hoàn thành</option>
              <option value={TaskStatus.CANCELLED}>Đã hủy</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Tình trạng hiện tại của task
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nhóm
            </label>
            <select
              value={formData.groupId}
              onChange={(e) => handleChange('groupId', e.target.value)}
              className="input-field"
            >
              <option value="">Nhóm mặc định</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.icon} {group.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Phân loại task theo nhóm
            </p>
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
    </Modal>
  )
}

export default TaskForm