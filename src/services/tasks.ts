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
} from 'firebase/firestore'
import { db } from './firebase'
import { Task, TaskStatus, Priority } from '../types'
import { debugLog, debugError } from '../utils/debug'

// Firestore data conversion utilities
export const taskToFirestore = (task: Omit<Task, 'id' | 'userId'>) => {
  return {
    ...task,
    startDate: task.startDate ? Timestamp.fromDate(task.startDate) : null,
    dueDate: task.dueDate ? Timestamp.fromDate(task.dueDate) : null,
    createdAt: Timestamp.fromDate(task.createdAt),
    updatedAt: Timestamp.fromDate(task.updatedAt),
    completedAt: task.completedAt ? Timestamp.fromDate(task.completedAt) : null,
  }
}

export const firestoreToTask = (doc: DocumentData, userId: string): Task => {
  const data = doc.data()
  return {
    id: doc.id,
    userId,
    ...data,
    startDate: data.startDate?.toDate() || null,
    dueDate: data.dueDate?.toDate() || null,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    completedAt: data.completedAt?.toDate() || null,
  }
}

export class TaskService {
  private getTasksCollection(userId: string) {
    return collection(db, 'users', userId, 'tasks')
  }

  // Create a new task
  async createTask(userId: string, taskData: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
    try {
      debugLog('TaskService: Creating task', { userId, taskData })
      
      const now = new Date()
      const task = {
        ...taskData,
        createdAt: now,
        updatedAt: now,
      }

      const firestoreData = taskToFirestore(task)
      debugLog('TaskService: Firestore data', firestoreData)
      
      const docRef = await addDoc(this.getTasksCollection(userId), firestoreData)
      debugLog('TaskService: Task created with ID', docRef.id)
      
      return { id: docRef.id, error: null }
    } catch (error: any) {
      debugError('TaskService: Create task failed', error)
      return { id: null, error: error.message }
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
        updatedAt: Timestamp.fromDate(new Date()),
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
      return { error: error.message }
    }
  }

  // Delete a task
  async deleteTask(userId: string, taskId: string) {
    try {
      const taskRef = doc(this.getTasksCollection(userId), taskId)
      await deleteDoc(taskRef)
      return { error: null }
    } catch (error: any) {
      return { error: error.message }
    }
  }

  // Toggle task completion
  async toggleTaskCompletion(userId: string, taskId: string, isCompleted: boolean) {
    try {
      const updates: Partial<Task> = {
        isCompleted,
        status: isCompleted ? TaskStatus.COMPLETED : TaskStatus.TODO,
        completedAt: isCompleted ? new Date() : null,
      }

      return await this.updateTask(userId, taskId, updates)
    } catch (error: any) {
      return { error: error.message }
    }
  }

  // Subscribe to real-time task updates
  subscribeToTasks(userId: string, callback: (tasks: Task[]) => void) {
    debugLog('TaskService: Subscribing to tasks for user', userId)
    
    const q = query(
      this.getTasksCollection(userId),
      orderBy('createdAt', 'desc')
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
        
        debugLog('TaskService: Calling callback with tasks', tasks.length)
        callback(tasks)
      },
      (error) => {
        debugError('TaskService: Subscription error', error)
      }
    )
  }

  // Get tasks with filters
  subscribeToFilteredTasks(
    userId: string,
    filters: {
      status?: TaskStatus[]
      priority?: Priority[]
      categoryId?: string
    },
    callback: (tasks: Task[]) => void
  ) {
    let q = query(this.getTasksCollection(userId))

    if (filters.status && filters.status.length > 0) {
      q = query(q, where('status', 'in', filters.status))
    }

    if (filters.priority && filters.priority.length > 0) {
      q = query(q, where('priority', 'in', filters.priority))
    }

    if (filters.categoryId) {
      q = query(q, where('categoryId', '==', filters.categoryId))
    }

    q = query(q, orderBy('createdAt', 'desc'))

    return onSnapshot(q, (snapshot: QuerySnapshot) => {
      const tasks = snapshot.docs.map(doc => firestoreToTask(doc, userId))
      callback(tasks)
    })
  }
}

export const taskService = new TaskService()