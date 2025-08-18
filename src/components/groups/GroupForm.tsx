import { useState } from 'react'
import { Group } from '../../types'
import { useGroupStore } from '../../stores/groupStore'
import { useAuthStore } from '../../stores/authStore'
import { Modal } from '../ui/Modal'
import LoadingSpinner from '../ui/LoadingSpinner'

interface GroupFormProps {
  group?: Group
  onClose: () => void
  onSuccess?: () => void
}

const GroupForm: React.FC<GroupFormProps> = ({ group, onClose, onSuccess }) => {
  const { user } = useAuthStore()
  const { createGroup, updateGroup } = useGroupStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: group?.name || '',
    color: group?.color || '#3B82F6',
    icon: group?.icon || '📁',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('User not authenticated')
      return
    }

    if (!formData.name.trim()) {
      setError('Group name is required')
      return
    }

    // Prevent creating/editing groups with default names (except if it's already a default group)
    const trimmedName = formData.name.trim()
    const isDefaultGroup = group && (group.name === 'Default' || group.name === 'Nhóm mặc định')
    
    if (!isDefaultGroup && (trimmedName === 'Default' || trimmedName === 'Nhóm mặc định')) {
      setError('Không thể tạo nhóm với tên "Default" hoặc "Nhóm mặc định". Vui lòng chọn tên khác.')
      return
    }
    
    // If editing a default group, prevent changing the name
    if (isDefaultGroup && trimmedName !== group.name) {
      setError('Không thể thay đổi tên của nhóm mặc định.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const groupData = {
        name: formData.name.trim(),
        color: formData.color,
        icon: formData.icon,
      }

      if (group) {
        await updateGroup(user.uid, group.id, groupData)
      } else {
        await createGroup(user.uid, groupData)
      }

      onSuccess?.()
      onClose()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const iconOptions = ['📁', '💼', '🏠', '🎯', '📚', '💡', '🔧', '🎨', '🏃‍♂️', '🍕', '🎵', '🌟']
  const colorOptions = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ]

  return (
    <Modal 
      isOpen={true} 
      onClose={onClose} 
      title={group ? 'Chỉnh sửa Nhóm' : 'Tạo Nhóm mới'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Group Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="input-field"
              placeholder="Enter group name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Icon
            </label>
            <div className="grid grid-cols-6 gap-2">
              {iconOptions.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => handleChange('icon', icon)}
                  className={`p-2 text-lg rounded border-2 transition-colors ${
                    formData.icon === icon
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <div className="grid grid-cols-4 gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleChange('color', color)}
                  className={`w-full h-8 rounded border-2 transition-all ${
                    formData.color === color
                      ? 'border-gray-800 scale-110'
                      : 'border-gray-200 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
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
              disabled={loading || !formData.name.trim()}
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                group ? 'Update Group' : 'Create Group'
              )}
            </button>
          </div>
        </form>
    </Modal>
  )
}

export default GroupForm