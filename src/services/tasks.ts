import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  DocumentData,
  QuerySnapshot,
  serverTimestamp,
  limit,
  startAfter,
  getDocs,
  QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db } from './firebase'
import { Task, TaskStatus, Priority } from '../types'
import { debugLog, debugError } from '../utils/debug'
import { getFirebaseErrorMessage } from '../utils/errorHandler'

// Firestore data conversion utilities
export const taskToFirestore = (task: Omit<Task, 'id' | 'userId'>) => {
  return {
    ...task,
    startDate: task.startDate ? Timestamp.fromDate(task.startDate) : null,
    dueDate: task.dueDate ? Timestamp.fromDate(task.dueDate) : null,
    // Remove client timestamps - will be set by server
    createdAt: task.createdAt ? Timestamp.fromDate(task.createdAt) : serverTimestamp(),
    updatedAt: serverTimestamp(),
    completedAt: task.completedAt ? Timestamp.fromDate(task.completedAt) : null,
  }
}

export const firestoreToTask = (doc: DocumentData, userId: string): Task => {
  const data = doc.data()
  return {
    id: doc.id,
    userId,
    ...data,
    startDate: data.startDate?.toDate?.() || null,
    dueDate: data.dueDate?.toDate?.() || null,
    createdAt: data.createdAt?.toDate?.() || new Date(), // Defensive read
    updatedAt: data.updatedAt?.toDate?.() || new Date(),
    completedAt: data.completedAt?.toDate?.() || null,
  }
}

// Query cache for performance optimization
const queryCache = new Map<string, { data: Task[], timestamp: number, ttl: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export class TaskService {
  private getTasksCollection(userId: string) {
    return collection(db, 'users', userId, 'tasks')
  }

  // Get cached query result if still valid
  private getCachedQuery(cacheKey: string): Task[] | null {
    const cached = queryCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      debugLog('TaskService: Using cached query result', { cacheKey })
      return cached.data
    }
    if (cached) {
      queryCache.delete(cacheKey)
    }
    return null
  }

  // Cache query result
  private setCachedQuery(cacheKey: string, data: Task[], ttl = CACHE_TTL) {
    queryCache.set(cacheKey, { data, timestamp: Date.now(), ttl })
    debugLog('TaskService: Cached query result', { cacheKey, count: data.length })

    // Limit cache size
    if (queryCache.size > 20) {
      const firstKey = queryCache.keys().next().value
      if (firstKey) {
        queryCache.delete(firstKey)
      }
    }
  }

  // Clear cache for user
  clearUserCache(userId: string) {
    const keysToDelete = Array.from(queryCache.keys()).filter(key => key.includes(userId))
    keysToDelete.forEach(key => queryCache.delete(key))
    debugLog('TaskService: Cleared cache for user', { userId, deletedKeys: keysToDelete.length })
  }

  // Create a new task
  async createTask(userId: string, taskData: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
    try {
      debugLog('TaskService: Creating task', { userId, taskData })
      
      const firestoreData = {
        ...taskData,
        startDate: taskData.startDate ? Timestamp.fromDate(taskData.startDate) : null,
        dueDate: taskData.dueDate ? Timestamp.fromDate(taskData.dueDate) : null,
        completedAt: taskData.completedAt ? Timestamp.fromDate(taskData.completedAt) : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
      
      debugLog('TaskService: Firestore data', firestoreData)
      
      const docRef = await addDoc(this.getTasksCollection(userId), firestoreData)
      debugLog('TaskService: Task created with ID', docRef.id)
      
      return { id: docRef.id, error: null }
    } catch (error: any) {
      debugError('TaskService: Create task failed', error)
      const friendlyError = getFirebaseErrorMessage(error)
      return { id: null, error: friendlyError }
    }
  }

  // Update an existing task
  async updateTask(userId: string, taskId: string, updates: Partial<Task>) {
    try {
      debugLog('TaskService: Updating task', { userId, taskId, updates })
      
      const taskRef = doc(this.getTasksCollection(userId), taskId)
      
      // Clean the update data to remove undefined values
      const cleanUpdates: any = {}
      
      // Copy non-undefined values
      Object.keys(updates).forEach(key => {
        const value = (updates as any)[key]
        if (value !== undefined) {
          cleanUpdates[key] = value
        }
      })
      
      const updateData: any = {
        ...cleanUpdates,
        updatedAt: serverTimestamp(),
      }

      // Handle date fields specifically
      if (updates.startDate !== undefined) {
        updateData.startDate = updates.startDate ? Timestamp.fromDate(updates.startDate) : null
      }

      if (updates.dueDate !== undefined) {
        updateData.dueDate = updates.dueDate ? Timestamp.fromDate(updates.dueDate) : null
      }

      if (updates.completedAt !== undefined) {
        updateData.completedAt = updates.completedAt ? Timestamp.fromDate(updates.completedAt) : null
      }

      debugLog('TaskService: Clean update data', updateData)
      
      await updateDoc(taskRef, updateData)
      debugLog('TaskService: Task updated successfully')
      
      return { error: null }
    } catch (error: any) {
      debugError('TaskService: Update task failed', error)
      const friendlyError = getFirebaseErrorMessage(error)
      return { error: friendlyError }
    }
  }

  // Delete a task
  async deleteTask(userId: string, taskId: string) {
    try {
      const taskRef = doc(this.getTasksCollection(userId), taskId)
      await deleteDoc(taskRef)
      return { error: null }
    } catch (error: any) {
      const friendlyError = getFirebaseErrorMessage(error)
      return { error: friendlyError }
    }
  }

  // Toggle task completion
  async toggleTaskCompletion(userId: string, taskId: string, isCompleted: boolean) {
    try {
      debugLog('TaskService: Toggling task completion', { userId, taskId, isCompleted })
      
      const updates: Partial<Task> = {
        isCompleted,
        status: isCompleted ? TaskStatus.COMPLETED : TaskStatus.TODO,
        completedAt: isCompleted ? new Date() : null,
      }

      debugLog('TaskService: Update data for toggle', updates)
      const result = await this.updateTask(userId, taskId, updates)
      
      if (result.error) {
        debugError('TaskService: Toggle completion failed', result.error)
      } else {
        debugLog('TaskService: Toggle completion successful')
      }
      
      return result
    } catch (error: any) {
      debugError('TaskService: Toggle completion exception', error)
      const friendlyError = getFirebaseErrorMessage(error)
      return { error: friendlyError }
    }
  }

  // Subscribe to real-time task updates with caching
  subscribeToTasks(userId: string, callback: (tasks: Task[]) => void, pageSize?: number) {
    debugLog('TaskService: Subscribing to tasks for user', { userId, pageSize })

    const cacheKey = `tasks_${userId}_all`
    const cachedTasks = this.getCachedQuery(cacheKey)

    // Return cached data immediately if available
    if (cachedTasks) {
      debugLog('TaskService: Returning cached tasks immediately', { count: cachedTasks.length })
      callback(cachedTasks)
    }

    const q = query(
      this.getTasksCollection(userId),
      orderBy('createdAt', 'desc'),
      ...(pageSize ? [limit(pageSize)] : [])
    )

    return onSnapshot(q,
      (snapshot: QuerySnapshot) => {
        debugLog('TaskService: Received snapshot', {
          size: snapshot.size,
          empty: snapshot.empty,
          changes: snapshot.docChanges().length
        })

        const tasks = snapshot.docs.map(doc => {
          const task = firestoreToTask(doc, userId)
          debugLog('TaskService: Converted task', { id: task.id, title: task.title })
          return task
        })

        // Cache the results
        this.setCachedQuery(cacheKey, tasks)

        debugLog('TaskService: Calling callback with tasks', tasks.length)
        callback(tasks)
      },
      (error) => {
        debugError('TaskService: Subscription error', error)
        // Call callback with cached data or empty array
        callback(cachedTasks || [])
      }
    )
  }

  // Get tasks with filters (optimized with caching)
  subscribeToFilteredTasks(
    userId: string,
    filters: {
      status?: TaskStatus[]
      priority?: Priority[]
      groupId?: string
      searchQuery?: string
      dateRange?: { start: Date; end: Date }
    },
    callback: (tasks: Task[]) => void,
    pageSize?: number
  ) {
    // Create cache key from filters
    const filterKey = JSON.stringify(filters)
    const cacheKey = `filtered_${userId}_${filterKey}`

    // Check cache first
    const cachedTasks = this.getCachedQuery(cacheKey)
    if (cachedTasks) {
      debugLog('TaskService: Returning cached filtered tasks', { cacheKey, count: cachedTasks.length })
      callback(cachedTasks)
    }

    let q = query(this.getTasksCollection(userId))

    // Apply filters (optimized compound queries)
    if (filters.status && filters.status.length > 0) {
      q = query(q, where('status', 'in', filters.status))
    }

    if (filters.priority && filters.priority.length > 0) {
      q = query(q, where('priority', 'in', filters.priority))
    }

    if (filters.groupId) {
      q = query(q, where('groupId', '==', filters.groupId))
    }

    // For search queries, we'll handle client-side filtering
    // since Firestore doesn't support text search efficiently
    if (filters.searchQuery) {
      debugLog('TaskService: Search query will be handled client-side', { query: filters.searchQuery })
    }

    // Always order by createdAt for consistent pagination
    q = query(q, orderBy('createdAt', 'desc'))

    // Apply pagination if specified
    if (pageSize) {
      q = query(q, limit(pageSize))
    }

    return onSnapshot(q, (snapshot: QuerySnapshot) => {
      let tasks = snapshot.docs.map(doc => firestoreToTask(doc, userId))

      // Apply client-side search filtering if needed
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        tasks = tasks.filter(task =>
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query)
        )
      }

      // Apply date range filtering if needed
      if (filters.dateRange) {
        tasks = tasks.filter(task => {
          if (!task.dueDate) return false
          return task.dueDate >= filters.dateRange!.start &&
                 task.dueDate <= filters.dateRange!.end
        })
      }

      // Cache the filtered results
      this.setCachedQuery(cacheKey, tasks)

      debugLog('TaskService: Filtered tasks computed and cached', {
        originalCount: snapshot.size,
        filteredCount: tasks.length,
        cacheKey
      })

      callback(tasks)
    })
  }

  // Get paginated tasks with cursor support
  async getTasksPage(
    userId: string,
    pageSize: number = 20,
    startAfterDoc?: QueryDocumentSnapshot
  ): Promise<{ tasks: Task[], hasMore: boolean, lastDoc?: QueryDocumentSnapshot }> {
    try {
      debugLog('TaskService: Getting paginated tasks', { userId, pageSize, hasStartAfter: !!startAfterDoc })

      let q = query(
        this.getTasksCollection(userId),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      )

      if (startAfterDoc) {
        q = query(q, startAfter(startAfterDoc))
      }

      const snapshot = await getDocs(q)
      const tasks = snapshot.docs.map(doc => firestoreToTask(doc, userId))

      const hasMore = snapshot.docs.length === pageSize
      const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : undefined

      debugLog('TaskService: Paginated tasks loaded', {
        count: tasks.length,
        hasMore,
        hasLastDoc: !!lastDoc
      })

      return { tasks, hasMore, lastDoc }
    } catch (error) {
      debugError('TaskService: Pagination error', error)
      throw error
    }
  }
}

export const taskService = new TaskService()