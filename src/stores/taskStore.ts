import { create } from 'zustand'
import { Task, TaskFilters, TaskSort, TaskStatus, Priority } from '../types'
import { taskService } from '../services/tasks'
import { useAuthStore } from './authStore'
import { debugLog, debugError } from '../utils/debug'
import { collection, getDocsFromServer } from 'firebase/firestore'
import { db } from '../services/firebase'

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
  createTask: (userId: string, taskData: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateTask: (userId: string, taskId: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (userId: string, taskId: string) => Promise<void>
  toggleTaskCompletion: (userId: string, taskId: string, isCompleted: boolean) => Promise<void>
  
  // Computed values
  getFilteredTasks: () => Task[]
  getTasksByStatus: (status: TaskStatus) => Task[]
  getOverdueTasks: () => Task[]
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
        await new Promise(resolve => setTimeout(resolve, 300)) // Reduced to 300ms
        
        // Use fallback approach directly to avoid permission errors
        debugLog('TaskStore: Using server read to avoid permission issues')
        
        try {
          const tasksRef = collection(db, 'users', user.uid, 'tasks')
          const snapshot = await getDocsFromServer(tasksRef)
          
          const tasks = snapshot.docs.map(doc => {
            const data = doc.data()
            return {
              id: doc.id,
              userId: user.uid,
              title: data.title,
              description: data.description || '',
              priority: data.priority,
              status: data.status,
              isCompleted: data.isCompleted,
              groupId: data.groupId || 'default',
              startDate: data.startDate?.toDate?.() || null,
              dueDate: data.dueDate?.toDate?.() || null,
              createdAt: data.createdAt?.toDate?.() || new Date(),
              updatedAt: data.updatedAt?.toDate?.() || new Date(),
              completedAt: data.completedAt?.toDate?.() || null,
            }
          })
          
          set({ tasks, loading: false, error: null })
        } catch (error: any) {
          debugError('TaskStore: Server read failed', error)
          set({ loading: false, error: 'Failed to load tasks' })
        }
      } catch (error: any) {
        debugError('TaskStore: Failed to subscribe to tasks', error)
        
        // Retry if permission denied and retries left
        if (error.code === 'permission-denied' && retries > 0) {
          debugLog(`TaskStore: Retrying in 1s... (${retries} retries left)`)
          setTimeout(() => setupTasksWithRetry(retries - 1), 500)
          return
        }
        
        set({ loading: false, error: 'Failed to load tasks. Please try refreshing the page.' })
      }
    }
    
    setupTasksWithRetry()
  },

  refreshTasks: () => {
    const authState = useAuthStore.getState()
    const user = authState.user
    
    if (!user) return
    
    set({ loading: true })
    
    // Force server read for refresh
    const refreshData = async () => {
      try {
        const tasksRef = collection(db, 'users', user.uid, 'tasks')
        const snapshot = await getDocsFromServer(tasksRef)
        
        const tasks = snapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            userId: user.uid,
            title: data.title,
            description: data.description || '',
            priority: data.priority,
            status: data.status,
            isCompleted: data.isCompleted,
            groupId: data.groupId || 'default',
            startDate: data.startDate?.toDate?.() || null,
            dueDate: data.dueDate?.toDate?.() || null,
            createdAt: data.createdAt?.toDate?.() || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || new Date(),
            completedAt: data.completedAt?.toDate?.() || null,
          }
        })
        
        set({ tasks, loading: false, error: null })
      } catch (error: any) {
        set({ loading: false, error: 'Failed to refresh tasks' })
      }
    }
    
    refreshData()
  },
  
  createTask: async (userId, taskData) => {
    debugLog('TaskStore: Creating task', { userId, taskData })
    set({ loading: true, error: null })
    try {
      const result = await taskService.createTask(userId, taskData)
      debugLog('TaskStore: Create task result', result)
      
      if (result.error) {
        debugError('TaskStore: Create task failed', result.error)
        set({ error: result.error, loading: false })
        throw new Error(result.error)
      } else {
        debugLog('TaskStore: Task created successfully', result.id)
        set({ loading: false })
      }
    } catch (error: any) {
      debugError('TaskStore: Create task exception', error)
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
}))