import React from 'react'
import { Task, Priority } from '../../types'
import { Modal } from '../ui/Modal'
import { getTasksForDate } from '../../utils/taskDisplayLogic'
import { useGroupStore } from '../../stores/groupStore'

interface DayTasksModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: Date | null
  tasks: Task[]
}

const DayTasksModal: React.FC<DayTasksModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  tasks
}) => {
  const { getGroupById } = useGroupStore()

  if (!selectedDate) return null

  // Lấy tất cả tasks cho ngày được chọn
  const dayTasksInfo = getTasksForDate(tasks, selectedDate)
  
  // Sắp xếp tasks theo priority và urgency
  const sortedTasks = dayTasksInfo.sort((a, b) => {
    // Ưu tiên urgent trước
    if (a.urgencyLevel !== b.urgencyLevel) {
      const urgencyOrder = { 'critical': 3, 'urgent': 2, 'normal': 1 }
      return urgencyOrder[b.urgencyLevel] - urgencyOrder[a.urgencyLevel]
    }
    
    // Sau đó sắp xếp theo priority
    const priorityOrder = { 
      [Priority.URGENT]: 4, 
      [Priority.HIGH]: 3, 
      [Priority.MEDIUM]: 2, 
      [Priority.LOW]: 1 
    }
    return priorityOrder[b.task.priority] - priorityOrder[a.task.priority]
  })

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.URGENT:
        return 'bg-red-500'
      case Priority.HIGH:
        return 'bg-orange-500'
      case Priority.MEDIUM:
        return 'bg-yellow-500'
      case Priority.LOW:
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getPriorityText = (priority: Priority) => {
    switch (priority) {
      case Priority.URGENT:
        return 'Khẩn cấp'
      case Priority.HIGH:
        return 'Cao'
      case Priority.MEDIUM:
        return 'Trung bình'
      case Priority.LOW:
        return 'Thấp'
      default:
        return 'Không xác định'
    }
  }

  const getUrgencyText = (urgencyLevel: string) => {
    switch (urgencyLevel) {
      case 'critical':
        return 'Cực kỳ khẩn cấp'
      case 'urgent':
        return 'Khẩn cấp'
      default:
        return ''
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Công việc ngày ${formatDate(selectedDate)}`}
      className="max-w-2xl"
    >
      <div className="max-h-96 overflow-y-auto">
        {sortedTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>Không có công việc nào trong ngày này</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedTasks.map(({ task, isOverdue, urgencyLevel }) => {
              const group = task.groupId ? getGroupById(task.groupId) : null
              
              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-lg border ${
                    isOverdue 
                      ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20'
                      : urgencyLevel === 'critical'
                      ? 'border-red-200 bg-red-25 dark:border-red-700 dark:bg-red-900/10'
                      : urgencyLevel === 'urgent'
                      ? 'border-orange-200 bg-orange-25 dark:border-orange-700 dark:bg-orange-900/10'
                      : 'border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Tiêu đề task */}
                      <div className="flex items-center space-x-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`} />
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {task.title}
                        </h3>
                        {isOverdue && (
                          <span className="text-red-600 font-bold text-sm" title="Quá hạn">
                            ⚠ Quá hạn
                          </span>
                        )}
                        {!isOverdue && urgencyLevel === 'critical' && (
                          <span className="text-red-500 font-bold text-sm" title="Cực kỳ khẩn cấp">
                            🔥 {getUrgencyText(urgencyLevel)}
                          </span>
                        )}
                        {!isOverdue && urgencyLevel === 'urgent' && (
                          <span className="text-orange-500 font-bold text-sm" title="Khẩn cấp">
                            ⚡ {getUrgencyText(urgencyLevel)}
                          </span>
                        )}
                      </div>

                      {/* Mô tả task */}
                      {task.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          {task.description}
                        </p>
                      )}

                      {/* Thông tin chi tiết */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <span>Độ ưu tiên:</span>
                          <span className="font-medium">{getPriorityText(task.priority)}</span>
                        </div>
                        
                        {group && (
                          <div className="flex items-center space-x-1">
                            <span>Nhóm:</span>
                            <span className="font-medium">
                              {group.icon} {group.name}
                            </span>
                          </div>
                        )}

                        {task.startDate && (
                          <div className="flex items-center space-x-1">
                            <span>Bắt đầu:</span>
                            <span className="font-medium">
                              {new Date(task.startDate).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        )}

                        {task.dueDate && (
                          <div className="flex items-center space-x-1">
                            <span>Hạn cuối:</span>
                            <span className="font-medium">
                              {new Date(task.dueDate).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Thống kê */}
      {sortedTasks.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
            <span>Tổng cộng: {sortedTasks.length} công việc</span>
            <div className="flex space-x-4">
              {sortedTasks.filter(t => t.urgencyLevel === 'critical' || t.isOverdue).length > 0 && (
                <span className="text-red-600">
                  Khẩn cấp: {sortedTasks.filter(t => t.urgencyLevel === 'critical' || t.isOverdue).length}
                </span>
              )}
              {sortedTasks.filter(t => t.urgencyLevel === 'urgent' && !t.isOverdue).length > 0 && (
                <span className="text-orange-600">
                  Cần chú ý: {sortedTasks.filter(t => t.urgencyLevel === 'urgent' && !t.isOverdue).length}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default DayTasksModal