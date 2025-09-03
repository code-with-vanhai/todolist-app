import { create } from 'zustand'
import { Task, TaskFilters, TaskSort, TaskStatus, Priority } from '../types'
import { taskService } from '../services/tasks'
import { useAuthStore } from './authStore'
import { debugLog, debugError } from '../utils/debug'
import { cacheManager } from '../utils/cacheManager'
import { backgroundSyncManager } from '../utils/backgroundSync'

// Create a memoization cache for filtered tasks
const filterCache = new Map<string, Task[]>()
let lastFilterKey = ''

interface TaskState {
  tasks: Task[]
  loading: boolean
  error: string | null
  filters: TaskFilters
  sort: TaskSort
  unsubscribe: (() => void) | null
  
  // Actions
  setTasks: (tasks: Task[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setFilters: (filters: TaskFilters) => void
  setSort: (sort: TaskSort) => void
  setUnsubscribe: (unsubscribe: (() => void) | null) => void
  
  // Task operations
  fetchTasks: () => void
  refreshTasks: () => void
  cleanup: () => void
  createTask: (userId: string, taskData: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateTask: (userId: string, taskId: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (userId: string, taskId: string) => Promise<void>
  toggleTaskCompletion: (userId: string, taskId: string, isCompleted: boolean) => Promise<void>
  
  // Computed values
  getFilteredTasks: () => Task[]
  getTasksByStatus: (status: TaskStatus) => Task[]
  getOverdueTasks: () => Task[]

  // Cache management
  getCacheStats: () => Promise<{ entries: number; totalSize: number }>
  clearCache: () => Promise<void>
  preloadCache: (userId: string) => Promise<void>

  // Background sync
  getSyncStatus: () => { isOnline: boolean; pendingCount: number; isSyncing: boolean }
  getPendingOperations: () => any[]
  forceSync: () => Promise<void>
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,
  filters: {},
  sort: { field: 'createdAt', direction: 'desc' },
  unsubscribe: null,
  
  setTasks: (tasks) => set({ tasks }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setFilters: (filters) => set({ filters }),
  setSort: (sort) => set({ sort }),
  setUnsubscribe: (unsubscribe) => set({ unsubscribe }),
  
  fetchTasks: () => {
    const { unsubscribe, loading } = get()
    
    // Prevent duplicate calls
    if (loading) {
      debugLog('TaskStore: Already loading, skipping duplicate call')
      return
    }
    
    // Cleanup existing subscription
    if (unsubscribe) {
      unsubscribe()
    }
    
    set({ loading: true, error: null })
    
    // Get current user from auth store
    const authState = useAuthStore.getState()
    const user = authState.user
    
    if (!user) {
      set({ loading: false, error: 'User not authenticated' })
      return
    }
    
    // Add delay and retry mechanism to ensure Firebase Auth is fully synced
    const setupTasksWithRetry = async (retries = 3) => {
      try {
        // Wait for auth to be fully ready
        await new Promise(resolve => setTimeout(resolve, 300))
        
        debugLog('TaskStore: Setting up real-time listener for tasks')
        
        // Use real-time subscription instead of one-time read
        const newUnsubscribe = taskService.subscribeToTasks(user.uid, (tasks) => {
          debugLog('TaskStore: Received real-time tasks update', { count: tasks.length })
          set({ 
            tasks, 
            loading: false, 
            error: null 
          })
        })
        
        // Store the unsubscribe function for cleanup
        set({ unsubscribe: newUnsubscribe })
        
        debugLog('TaskStore: Real-time listener setup complete')
        
      } catch (error: any) {
        debugError('TaskStore: Failed to setup real-time listener', error)
        
        // Retry if permission denied and retries left
        if (error.code === 'permission-denied' && retries > 0) {
          debugLog(`TaskStore: Retrying in 1s... (${retries} retries left)`)
          setTimeout(() => setupTasksWithRetry(retries - 1), 1000)
          return
        }
        
        set({ loading: false, error: 'Failed to load tasks. Please try refreshing the page.' })
      }
    }
    
    setupTasksWithRetry()
  },

  refreshTasks: () => {
    debugLog('TaskStore: Manual refresh requested, re-establishing real-time listener')
    // Since we're using real-time listeners, just re-fetch to re-establish the subscription
    // This ensures we have the latest data and a fresh listener connection
    get().fetchTasks()
  },

  cleanup: () => {
    const { unsubscribe } = get()
    debugLog('TaskStore: Cleaning up real-time listener')
    if (unsubscribe) {
      unsubscribe()
      set({ unsubscribe: null })
    }
  },
  
    createTask: async (userId, taskData) => {
    debugLog('TaskStore: Creating task', { userId, taskData })
    set({ loading: true, error: null })

    try {
      const result = await taskService.createTask(userId, taskData)
      debugLog('TaskStore: Create task result', result)

      if (result.error) {
        debugError('TaskStore: Create task failed', result.error)

        // If offline or network error, add to background sync
        if (!navigator.onLine || result.error.includes('network')) {
          debugLog('TaskStore: Adding to background sync queue')
          await backgroundSyncManager.addPendingOperation('create', 'tasks', { userId, ...taskData })

          // Add optimistic update to local state
          const newTask: Task = {
            id: `temp_${Date.now()}`,
            userId,
            title: taskData.title,
            description: taskData.description,
            status: taskData.status || TaskStatus.TODO,
            priority: taskData.priority || Priority.MEDIUM,
            isCompleted: false,
            startDate: taskData.startDate,
            dueDate: taskData.dueDate,
            groupId: taskData.groupId,
            createdAt: new Date(),
            updatedAt: new Date(),
            completedAt: null
          }

          // Cache the new task locally
          await cacheManager.set(`task_${newTask.id}`, newTask, { ttl: 24 * 60 * 60 * 1000 })

          debugLog('TaskStore: Task added to cache for offline sync')
        }

        set({ error: result.error, loading: false })
        throw new Error(result.error)
      } else {
        debugLog('TaskStore: Task created successfully', result.id)
        // Clear cache for user to ensure fresh data
        taskService.clearUserCache(userId)
        set({ loading: false })
      }
    } catch (error: any) {
      debugError('TaskStore: Create task exception', error)

      // Add to background sync if it's a network error
      if (!navigator.onLine) {
        await backgroundSyncManager.addPendingOperation('create', 'tasks', { userId, ...taskData })
      }

      set({ error: error.message, loading: false })
      throw error
    }
  },
  
  updateTask: async (userId, taskId, updates) => {
    try {
      debugLog('TaskStore: Updating task', { userId, taskId, updates })
      const result = await taskService.updateTask(userId, taskId, updates)
      if (result.error) {
        debugError('TaskStore: Update task failed', result.error)
        set({ error: result.error })
        throw new Error(result.error)
      }
      debugLog('TaskStore: Update task successful')
      // Clear cache for user to ensure fresh data
      taskService.clearUserCache(userId)
    } catch (error: any) {
      debugError('TaskStore: Update task exception', error)
      set({ error: error.message })
      throw error
    }
  },
  
  deleteTask: async (userId, taskId) => {
    try {
      const result = await taskService.deleteTask(userId, taskId)
      if (result.error) {
        set({ error: result.error })
        throw new Error(result.error)
      }
      // Clear cache for user to ensure fresh data
      taskService.clearUserCache(userId)
    } catch (error: any) {
      set({ error: error.message })
      throw error
    }
  },
  
  toggleTaskCompletion: async (userId, taskId, isCompleted) => {
    try {
      // Tắt optimistic update để tránh race condition
      debugLog('TaskStore: Toggling task completion', { taskId, isCompleted })
      
      const result = await taskService.toggleTaskCompletion(userId, taskId, isCompleted)
      if (result.error) {
        debugError('TaskStore: Toggle completion failed', result.error)
        set({ error: result.error })
        throw new Error(result.error)
      }
      
      debugLog('TaskStore: Toggle completion successful')
      // Real-time listener sẽ tự động update UI
    } catch (error: any) {
      debugError('TaskStore: Toggle completion exception', error)
      set({ error: error.message })
      throw error
    }
  },
  
  getFilteredTasks: () => {
    const { tasks, filters, sort } = get()

    // Create a cache key based on current filters and sort
    const filterKey = JSON.stringify({
      taskCount: tasks.length,
      filters,
      sort,
      // Include a hash of task IDs to detect task changes
      taskIds: tasks.map(t => t.id).sort().join(',')
    })

    // Return cached result if filters haven't changed and tasks haven't changed
    if (filterCache.has(filterKey) && filterKey === lastFilterKey) {
      debugLog('TaskStore: Using cached filtered tasks')
      return filterCache.get(filterKey)!
    }

    debugLog('TaskStore: Computing filtered tasks', { filterKey })

    let filteredTasks = [...tasks]

    // Apply filters
    if (filters.status && filters.status.length > 0) {
      filteredTasks = filteredTasks.filter(task => filters.status!.includes(task.status))
    }

    if (filters.priority && filters.priority.length > 0) {
      filteredTasks = filteredTasks.filter(task => filters.priority!.includes(task.priority))
    }

    if (filters.groupId) {
      filteredTasks = filteredTasks.filter(task => task.groupId === filters.groupId)
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      filteredTasks = filteredTasks.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
      )
    }

    if (filters.dateRange) {
      filteredTasks = filteredTasks.filter(task => {
        if (!task.dueDate) return false
        return task.dueDate >= filters.dateRange!.start && task.dueDate <= filters.dateRange!.end
      })
    }
    
    
    // Apply sorting
    filteredTasks.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sort.field) {
        case 'dueDate':
          aValue = a.dueDate?.getTime() || 0
          bValue = b.dueDate?.getTime() || 0
          break
        case 'createdAt':
          aValue = a.createdAt.getTime()
          bValue = b.createdAt.getTime()
          break
        case 'priority':
          const priorityOrder = { [Priority.URGENT]: 4, [Priority.HIGH]: 3, [Priority.MEDIUM]: 2, [Priority.LOW]: 1 }
          aValue = priorityOrder[a.priority]
          bValue = priorityOrder[b.priority]
          break
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        default:
          return 0
      }
      
      if (sort.direction === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    // Cache the result and update last filter key
    filterCache.set(filterKey, filteredTasks)
    lastFilterKey = filterKey

    // Limit cache size to prevent memory leaks
    if (filterCache.size > 10) {
      const firstKey = filterCache.keys().next().value
      if (firstKey) {
        filterCache.delete(firstKey)
      }
    }

    debugLog('TaskStore: Filtered tasks computed and cached', {
      originalCount: tasks.length,
      filteredCount: filteredTasks.length,
      cacheSize: filterCache.size
    })

    return filteredTasks
  },
  
  getTasksByStatus: (status) => {
    const { tasks } = get()
    return tasks.filter(task => task.status === status)
  },
  
  getOverdueTasks: () => {
    const { tasks } = get()
    const now = new Date()
    return tasks.filter(task =>
      task.dueDate &&
      task.dueDate < now &&
      task.status !== TaskStatus.COMPLETED
    )
  },

  // Cache management methods
  getCacheStats: async () => {
    try {
      const stats = await cacheManager.getStats()
      debugLog('TaskStore: Cache stats retrieved', stats)
      return stats
    } catch (error) {
      debugError('TaskStore: Failed to get cache stats', error)
      return { entries: 0, totalSize: 0 }
    }
  },

  clearCache: async () => {
    try {
      await cacheManager.clear()
      debugLog('TaskStore: Cache cleared successfully')
    } catch (error) {
      debugError('TaskStore: Failed to clear cache', error)
    }
  },

  preloadCache: async (userId) => {
    try {
      debugLog('TaskStore: Preloading cache for user', userId)

      // Preload user's tasks
      const tasks = await cacheManager.get(`tasks_${userId}_all`)
      if (tasks && Array.isArray(tasks)) {
        debugLog('TaskStore: Cache preloaded with tasks', { count: tasks.length })
      }

      // Preload user settings/preferences if any
      const userSettings = await cacheManager.get(`user_settings_${userId}`)
      if (userSettings) {
        debugLog('TaskStore: User settings preloaded from cache')
      }

    } catch (error) {
      debugError('TaskStore: Failed to preload cache', error)
    }
  },

  // Background sync methods
  getSyncStatus: () => {
    return backgroundSyncManager.getSyncStatus()
  },

  getPendingOperations: () => {
    return backgroundSyncManager.getPendingOperations()
  },

  forceSync: async () => {
    try {
      debugLog('TaskStore: Forcing background sync')
      await backgroundSyncManager.syncPendingOperations()
      debugLog('TaskStore: Background sync completed')
    } catch (error) {
      debugError('TaskStore: Background sync failed', error)
      throw error
    }
  },
}))