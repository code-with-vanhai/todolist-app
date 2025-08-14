import { Task, Priority } from '../types'

export interface TaskDisplayInfo {
  task: Task
  displayDate: Date
  isOverdue: boolean
  isUrgent: boolean
  urgencyLevel: 'normal' | 'urgent' | 'critical'
  shouldDisplay: boolean
}

/**
 * Determines how and when a task should be displayed based on the new logic:
 * - Before startDate: Show on startDate only
 * - Between startDate and dueDate: Show on current date with urgency based on proximity to dueDate
 * - After dueDate: Show on dueDate with overdue indicator
 * - Completed tasks: Don't show on calendar
 */
export function getTaskDisplayInfo(task: Task, currentDate: Date): TaskDisplayInfo {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const current = new Date(currentDate)
  current.setHours(0, 0, 0, 0)
  
  // Don't display completed tasks on calendar
  if (task.isCompleted) {
    return {
      task,
      displayDate: current,
      isOverdue: false,
      isUrgent: false,
      urgencyLevel: 'normal',
      shouldDisplay: false
    }
  }

  // If no startDate, use the old logic (show on dueDate)
  if (!task.startDate) {
    if (!task.dueDate) {
      return {
        task,
        displayDate: current,
        isOverdue: false,
        isUrgent: false,
        urgencyLevel: 'normal',
        shouldDisplay: false
      }
    }
    
    const dueDate = new Date(task.dueDate)
    dueDate.setHours(0, 0, 0, 0)
    
    const isOverdue = dueDate < today
    const shouldDisplay = dueDate.getTime() === current.getTime()
    
    return {
      task,
      displayDate: current,
      isOverdue,
      isUrgent: isOverdue,
      urgencyLevel: isOverdue ? 'critical' : 'normal',
      shouldDisplay
    }
  }

  const startDate = new Date(task.startDate)
  startDate.setHours(0, 0, 0, 0)
  
  const dueDate = task.dueDate ? new Date(task.dueDate) : null
  if (dueDate) {
    dueDate.setHours(0, 0, 0, 0)
  }

  // Case 1: Current date is before startDate
  if (today < startDate) {
    // Only show on startDate
    const shouldDisplay = current.getTime() === startDate.getTime()
    return {
      task,
      displayDate: startDate,
      isOverdue: false,
      isUrgent: false,
      urgencyLevel: 'normal',
      shouldDisplay
    }
  }

  // Case 2: Current date is after dueDate (if dueDate exists)
  if (dueDate && today > dueDate) {
    // Only show on dueDate with overdue indicator
    const shouldDisplay = current.getTime() === dueDate.getTime()
    return {
      task,
      displayDate: dueDate,
      isOverdue: true,
      isUrgent: true,
      urgencyLevel: 'critical',
      shouldDisplay
    }
  }

  // Case 3: Current date is between startDate and dueDate (or after startDate if no dueDate)
  // Show on current date with urgency based on proximity to dueDate
  const shouldDisplay = current.getTime() === today.getTime()
  
  if (!dueDate) {
    // No due date, just show normally
    return {
      task,
      displayDate: today,
      isOverdue: false,
      isUrgent: false,
      urgencyLevel: 'normal',
      shouldDisplay
    }
  }

  // Calculate urgency based on proximity to due date
  const totalDays = Math.max(1, Math.ceil((dueDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
  const remainingDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const progressRatio = (totalDays - remainingDays) / totalDays

  let urgencyLevel: 'normal' | 'urgent' | 'critical' = 'normal'
  let isUrgent = false

  if (remainingDays <= 1) {
    urgencyLevel = 'critical'
    isUrgent = true
  } else if (remainingDays <= 3 || progressRatio >= 0.8) {
    urgencyLevel = 'urgent'
    isUrgent = true
  } else if (progressRatio >= 0.6) {
    urgencyLevel = 'urgent'
    isUrgent = false
  }

  return {
    task,
    displayDate: today,
    isOverdue: false,
    isUrgent,
    urgencyLevel,
    shouldDisplay
  }
}

/**
 * Get all tasks that should be displayed on a specific date
 */
export function getTasksForDate(tasks: Task[], date: Date): TaskDisplayInfo[] {
  return tasks
    .map(task => getTaskDisplayInfo(task, date))
    .filter(info => info.shouldDisplay)
}

/**
 * Get the priority color with urgency consideration
 */
export function getTaskDisplayPriority(task: Task, urgencyLevel: 'normal' | 'urgent' | 'critical'): Priority {
  if (urgencyLevel === 'critical') {
    return Priority.URGENT
  }
  if (urgencyLevel === 'urgent' && task.priority !== Priority.URGENT) {
    return Priority.HIGH
  }
  return task.priority
}