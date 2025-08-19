import { useState, useEffect } from 'react'
import { Task, Priority } from '../../types'
import { useGroupStore } from '../../stores/groupStore'
import { useTaskStore } from '../../stores/taskStore'
import { useAuthStore } from '../../stores/authStore'
import TaskForm from '../tasks/TaskForm'
import DayTasksModal from './DayTasksModal'
import { getTasksForDate, getTaskDisplayPriority } from '../../utils/taskDisplayLogic'
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

interface DashboardCalendarProps {
  tasks: Task[]
}

const DashboardCalendar: React.FC<DashboardCalendarProps> = ({ tasks }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    task: Task
  } | null>(null)
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null)
  const [showMobileMenu, setShowMobileMenu] = useState<{
    task: Task
    x: number
    y: number
  } | null>(null)
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [showDayTasksModal, setShowDayTasksModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const { user } = useAuthStore()
  const { getGroupById, getDefaultGroup } = useGroupStore()
  const { filters, toggleTaskCompletion, updateTask } = useTaskStore()

  // Filter tasks based on selected group
  const filteredTasks = filters.groupId 
    ? tasks.filter(task => task.groupId === filters.groupId)
    : tasks // Show all tasks when no specific group filter is applied (including when Default is selected)

  // Get current month info
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const today = new Date()
  
  // Get first day of month and number of days
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  const startingDayOfWeek = firstDayOfMonth.getDay()

  // Get previous month's last days to fill the grid
  const prevMonth = new Date(year, month - 1, 0)
  const daysFromPrevMonth = startingDayOfWeek
  
  // Generate calendar days
  const calendarDays = []
  
  // Previous month days
  for (let i = daysFromPrevMonth; i > 0; i--) {
    const day = prevMonth.getDate() - i + 1
    const date = new Date(year, month - 1, day)
    calendarDays.push({
      date,
      day,
      isCurrentMonth: false,
      isToday: false,
    })
  }
  
  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const isToday = date.toDateString() === today.toDateString()
    calendarDays.push({
      date,
      day,
      isCurrentMonth: true,
      isToday,
    })
  }
  
  // Next month days to complete the grid (42 days = 6 weeks)
  const remainingDays = 42 - calendarDays.length
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month + 1, day)
    calendarDays.push({
      date,
      day,
      isCurrentMonth: false,
      isToday: false,
    })
  }

  // Get tasks for a specific date using new logic
  const getTasksForDateWithInfo = (date: Date) => {
    return getTasksForDate(filteredTasks, date)
  }

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Handle double-click on calendar day
  const handleDayDoubleClick = (date: Date) => {
    setSelectedDate(date)
    setShowDayTasksModal(true)
  }


  // Handle right-click context menu
  const handleTaskRightClick = (e: React.MouseEvent, task: Task) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (task.isCompleted) return // Don't show context menu for completed tasks
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      task
    })
  }

  // Handle marking task as done
  const handleMarkAsDone = async (task: Task) => {
    if (!user) return
    
    try {
      await toggleTaskCompletion(user.uid, task.id, true)
      setContextMenu(null)
    } catch (error) {
      console.error('Failed to mark task as done:', error)
    }
  }

  // Close menus when clicking elsewhere
  const handleDocumentClick = () => {
    setContextMenu(null)
    setShowMobileMenu(null)
  }

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    if (task.isCompleted) {
      e.preventDefault()
      return
    }
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', task.id)
  }

  // Handle drag over calendar day
  const handleDragOver = (e: React.DragEvent, date: Date) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverDate(date)
  }

  // Handle drag leave
  const handleDragLeave = () => {
    setDragOverDate(null)
  }

  // Handle drop on calendar day
  const handleDrop = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault()
    setDragOverDate(null)
    
    if (!draggedTask || !user) return
    
    // Set time to end of day for the new due date
    const newDueDate = new Date(targetDate)
    newDueDate.setHours(23, 59, 59, 999)
    
    try {
      await updateTask(user.uid, draggedTask.id, {
        dueDate: newDueDate
      })
      setDraggedTask(null)
    } catch (error) {
      console.error('Failed to update task due date:', error)
      setDraggedTask(null)
    }
  }

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedTask(null)
    setDragOverDate(null)
  }

  // Mobile touch handlers
  const handleTouchStart = (e: React.TouchEvent, task: Task) => {
    if (task.isCompleted) return
    
    const touch = e.touches[0]
    const timer = setTimeout(() => {
      // Long press detected
      setShowMobileMenu({
        task,
        x: touch.clientX,
        y: touch.clientY
      })
    }, 500)
    
    setLongPressTimer(timer)
  }

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }

  const handleTouchMove = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }

  // Add event listener for closing menus
  useEffect(() => {
    if (contextMenu || showMobileMenu) {
      document.addEventListener('click', handleDocumentClick)
      return () => document.removeEventListener('click', handleDocumentClick)
    }
  }, [contextMenu, showMobileMenu])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer)
      }
    }
  }, [longPressTimer])

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

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Get the selected group name for display
  const getSelectedGroupName = () => {
    if (filters.groupId) {
      const group = getGroupById(filters.groupId)
      return group ? `${group.icon} ${group.name}` : 'Unknown Group'
    }
    return null // Don't show filter badge when showing all tasks (Default behavior)
  }

  const selectedGroupName = getSelectedGroupName()

  return (
    <div className="w-full">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {monthNames[month]} {year}
          </h3>
          {selectedGroupName && (
            <span className="text-sm text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded-full">
              Filtered by: {selectedGroupName}
            </span>
          )}
          <button
            onClick={goToToday}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Today
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Day Names Header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((dayName) => (
          <div
            key={dayName}
            className="p-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400"
          >
            {dayName}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((calendarDay, index) => {
          const dayTasksInfo = getTasksForDateWithInfo(calendarDay.date)
          const isDragOver = dragOverDate?.toDateString() === calendarDay.date.toDateString()
          
          return (
            <div
              key={index}
              className={`min-h-[96px] p-2 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                calendarDay.isCurrentMonth
                  ? 'bg-white dark:bg-gray-800'
                  : 'bg-gray-50 dark:bg-gray-900'
              } ${
                calendarDay.isToday
                  ? 'ring-2 ring-primary-500'
                  : ''
              } ${
                isDragOver
                  ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700 border-2'
                  : ''
              }`}
              onDragOver={(e) => handleDragOver(e, calendarDay.date)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, calendarDay.date)}
              onDoubleClick={() => handleDayDoubleClick(calendarDay.date)}
              title="Double-click để xem tất cả công việc trong ngày"
            >
              {/* Day Number */}
              <div className={`text-sm font-medium mb-1 ${
                calendarDay.isCurrentMonth
                  ? calendarDay.isToday
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-900 dark:text-white'
                  : 'text-gray-400 dark:text-gray-600'
              }`}>
                {calendarDay.day}
              </div>

              {/* Tasks */}
              <div className="space-y-1">
                {dayTasksInfo.slice(0, 4).map((taskInfo) => {
                  const { task, isOverdue, urgencyLevel } = taskInfo
                  const group = task.groupId ? getGroupById(task.groupId) : getDefaultGroup()
                  const displayPriority = getTaskDisplayPriority(task, urgencyLevel)
                  
                  // Get background color based on urgency and overdue status
                  const getTaskBgColor = () => {
                    if (isOverdue) {
                      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border border-red-300 dark:border-red-700'
                    }
                    if (urgencyLevel === 'critical') {
                      return 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800'
                    }
                    if (urgencyLevel === 'urgent') {
                      return 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200 dark:border-orange-800'
                    }
                    return 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
                  }
                  
                  return (
                    <div
                      key={task.id}
                      draggable={!task.isCompleted}
                      className={`text-xs p-1 rounded truncate transition-all duration-200 ${getTaskBgColor()} cursor-move hover:opacity-80 ${
                        draggedTask?.id === task.id
                          ? 'opacity-50 scale-95'
                          : ''
                      }`}
                      title={`${task.title} - ${group?.name || 'Default'} ${isOverdue ? '(OVERDUE)' : urgencyLevel === 'critical' ? '(CRITICAL)' : urgencyLevel === 'urgent' ? '(URGENT)' : ''}`}
                      onDragStart={(e) => {
                        e.stopPropagation()
                        handleDragStart(e, task)
                      }}
                      onDragEnd={(e) => {
                        e.stopPropagation()
                        handleDragEnd()
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation()
                        setEditingTask(task)
                      }}
                      onContextMenu={(e) => {
                        e.stopPropagation()
                        handleTaskRightClick(e, task)
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation()
                        handleTouchStart(e, task)
                      }}
                      onTouchEnd={(e) => {
                        e.stopPropagation()
                        handleTouchEnd()
                      }}
                      onTouchMove={(e) => {
                        e.stopPropagation()
                        handleTouchMove()
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1 flex-1 min-w-0">
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(displayPriority)}`} />
                          <span className="truncate">{task.title}</span>
                          {isOverdue && (
                            <span className="text-red-600 font-bold" title="Overdue">⚠</span>
                          )}
                          {!isOverdue && urgencyLevel === 'critical' && (
                            <span className="text-red-500 font-bold" title="Critical urgency">🔥</span>
                          )}
                          {!isOverdue && urgencyLevel === 'urgent' && (
                            <span className="text-orange-500 font-bold" title="Urgent">⚡</span>
                          )}
                        </div>
                        {/* Mobile menu button - visible on small screens */}
                        <button
                          className="ml-1 text-gray-400 hover:text-gray-600 lg:hidden flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            const rect = e.currentTarget.getBoundingClientRect()
                            setShowMobileMenu({
                              task,
                              x: rect.right,
                              y: rect.bottom
                            })
                          }}
                          onDoubleClick={(e) => e.stopPropagation()}
                          aria-label="Tùy chọn task"
                        >
                          ⋮
                        </button>
                        {/* Desktop drag indicator */}
                        <span className="text-gray-400 text-xs hidden lg:block">⋮⋮</span>
                      </div>
                    </div>
                  )
                })}
                
                {/* Show more indicator */}
                {dayTasksInfo.length > 4 && (
                  <div 
                    className="text-xs text-gray-500 dark:text-gray-400 text-center cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDayDoubleClick(calendarDay.date)
                    }}
                    onDoubleClick={(e) => e.stopPropagation()}
                    title="Click để xem tất cả công việc"
                  >
                    +{dayTasksInfo.length - 4} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span>Urgent</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <span>High</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span>Medium</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>Low</span>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-1 z-50"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleMarkAsDone(contextMenu.task)}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
          >
            <CheckIcon className="w-4 h-4 text-green-600" />
            <span>Hoàn thành</span>
          </button>
          <button
            onClick={() => {
              setEditingTask(contextMenu.task)
              setContextMenu(null)
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Chỉnh sửa</span>
          </button>
        </div>
      )}

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div
          className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-1 z-50"
          style={{
            left: showMobileMenu.x,
            top: showMobileMenu.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              handleMarkAsDone(showMobileMenu.task)
              setShowMobileMenu(null)
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
          >
            <CheckIcon className="w-4 h-4 text-green-600" />
            <span>Hoàn thành</span>
          </button>
          <button
            onClick={() => {
              setEditingTask(showMobileMenu.task)
              setShowMobileMenu(null)
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Chỉnh sửa</span>
          </button>
        </div>
      )}

      {/* Task Edit Modal */}
      {editingTask && (
        <TaskForm
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSuccess={() => setEditingTask(null)}
        />
      )}

      {/* Day Tasks Modal */}
      <DayTasksModal
        isOpen={showDayTasksModal}
        onClose={() => setShowDayTasksModal(false)}
        selectedDate={selectedDate}
        tasks={filteredTasks}
      />
    </div>
  )
}

export default DashboardCalendar