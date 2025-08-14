import { useState } from 'react'
import { Group } from '../../types'
import { useGroupStore } from '../../stores/groupStore'
import { useAuthStore } from '../../stores/authStore'
import { XMarkIcon } from '@heroicons/react/24/outline'
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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {group ? 'Edit Group' : 'Create New Group'}
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
      </div>
    </div>
  )
}

export default GroupForm