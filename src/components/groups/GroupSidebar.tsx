import { useState, useEffect } from 'react'
import { useGroupStore } from '../../stores/groupStore'
import { useTaskStore } from '../../stores/taskStore'
import { useAuthStore } from '../../stores/authStore'
import { 
  ChevronDownIcon, 
  ChevronRightIcon, 
  PlusIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import GroupForm from './GroupForm'
import { useConfirm } from '../ui/ConfirmDialog'
import { useToast } from '../ui/Toast'

const GroupSidebar = () => {
  const { user } = useAuthStore()
  const { groups, fetchGroups, deleteGroup } = useGroupStore()
  const { filters, setFilters, tasks } = useTaskStore()
  const [isExpanded, setIsExpanded] = useState(true)
  const [showGroupForm, setShowGroupForm] = useState(false)
  const [editingGroup, setEditingGroup] = useState<any>(null)
  const { confirm, ConfirmComponent } = useConfirm()
  const { showToast } = useToast()

  useEffect(() => {
    // Only fetch groups if not already loaded to avoid permission issues
    if (groups.length === 0) {
      fetchGroups()
    }
  }, [fetchGroups, groups.length])

  // Calculate task count for each group
  const getTaskCount = (groupId: string) => {
    return tasks.filter(task => task.groupId === groupId).length
  }

  const getDefaultTaskCount = () => {
    // Count tasks with no group AND tasks assigned to any default group
    const defaultGroups = groups.filter(group => group.name === 'Default' || group.name === 'Nhóm mặc định')
    const defaultGroupIds = defaultGroups.map(g => g.id)
    return tasks.filter(task => 
      !task.groupId || defaultGroupIds.includes(task.groupId)
    ).length
  }

  const handleGroupClick = (groupId: string | null) => {
    if (filters.groupId === groupId) {
      // If already selected, clear filter
      setFilters({ ...filters, groupId: undefined })
    } else {
      // Select this group
      setFilters({ ...filters, groupId: groupId || undefined })
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (!user) return
    
    const group = groups.find(g => g.id === groupId)
    const taskCount = getTaskCount(groupId)
    
    confirm(
      'Xóa nhóm',
      `Bạn có chắc chắn muốn xóa nhóm "${group?.name}"? ${taskCount > 0 ? `${taskCount} task(s) sẽ được chuyển về nhóm Default.` : ''}`,
      async () => {
        try {
          await deleteGroup(user.uid, groupId)
          showToast(`Đã xóa nhóm "${group?.name}" thành công`, 'success')
        } catch (error: any) {
          showToast('Có lỗi xảy ra khi xóa nhóm', 'error')
        }
      },
      'danger',
      'Xóa nhóm'
    )
  }

  const handleEditGroup = (group: any) => {
    setEditingGroup(group)
    setShowGroupForm(true)
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        >
          {isExpanded ? (
            <ChevronDownIcon className="w-4 h-4 mr-1" />
          ) : (
            <ChevronRightIcon className="w-4 h-4 mr-1" />
          )}
          Groups
        </button>
        <button
          onClick={() => setShowGroupForm(true)}
          className="text-gray-400 hover:text-primary-600"
          aria-label="Thêm nhóm mới"
        >
          <PlusIcon className="w-4 h-4" />
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-1">
          {/* Default Group */}
          <button
            onClick={() => handleGroupClick(null)}
            className={`w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-md transition-colors ${
              filters.groupId === undefined
                ? 'bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center">
              <span className="mr-2 text-xs">📋</span>
              <span className="text-xs">Default</span>
            </div>
            <span className="text-xs bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {getDefaultTaskCount()}
            </span>
          </button>

          {/* Custom Groups */}
          {groups.filter(group => group.name !== 'Default' && group.name !== 'Nhóm mặc định').map((group) => (
            <div key={group.id} className="group relative">
              <button
                onClick={() => handleGroupClick(group.id)}
                className={`w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-md transition-colors ${
                  filters.groupId === group.id
                    ? 'bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center min-w-0">
                  <span className="mr-2 text-xs">{group.icon}</span>
                  <span className="text-xs truncate">{group.name}</span>
                </div>
                <div className="flex items-center space-x-1 ml-2">
                  <span className="text-xs bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {getTaskCount(group.id)}
                  </span>
                </div>
              </button>
              
              {/* Group Actions (visible on hover) - Hide for default groups */}
              {!(group.name === 'Default' || group.name === 'Nhóm mặc định') && (
                <div className="absolute right-8 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-0.5 bg-white dark:bg-gray-800 rounded shadow-sm">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditGroup(group)
                    }}
                    className="p-1 text-gray-400 hover:text-blue-600 rounded"
                    aria-label={`Chỉnh sửa nhóm ${group.name}`}
                  >
                    <PencilIcon className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteGroup(group.id)
                    }}
                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                    aria-label={`Xóa nhóm ${group.name}`}
                  >
                    <TrashIcon className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showGroupForm && (
        <GroupForm
          group={editingGroup}
          onClose={() => {
            setShowGroupForm(false)
            setEditingGroup(null)
          }}
          onSuccess={() => {
            setShowGroupForm(false)
            setEditingGroup(null)
            showToast(editingGroup ? 'Cập nhật nhóm thành công' : 'Tạo nhóm thành công', 'success')
          }}
        />
      )}
      <ConfirmComponent />
    </div>
  )
}

export default GroupSidebar