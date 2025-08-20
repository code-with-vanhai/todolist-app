import { create } from 'zustand'
import { Group } from '../types'
import { groupService } from '../services/groups'
import { useAuthStore } from './authStore'
import { debugLog, debugError } from '../utils/debug'
import { getFirebaseErrorMessage } from '../utils/errorHandler'

interface GroupState {
  groups: Group[]
  loading: boolean
  error: string | null
  unsubscribe: (() => void) | null
  
  // Actions
  setGroups: (groups: Group[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setUnsubscribe: (unsubscribe: (() => void) | null) => void
  
  // Group operations
  fetchGroups: () => void
  createGroup: (userId: string, groupData: Omit<Group, 'id' | 'userId' | 'createdAt'>) => Promise<void>
  updateGroup: (userId: string, groupId: string, updates: Partial<Group>) => Promise<void>
  deleteGroup: (userId: string, groupId: string) => Promise<void>
  
  // Computed values
  getGroupById: (groupId: string) => Group | undefined
  getDefaultGroup: () => Group
}

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  loading: false,
  error: null,
  unsubscribe: null,
  
  setGroups: (groups) => set({ groups }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setUnsubscribe: (unsubscribe) => set({ unsubscribe }),
  
  fetchGroups: () => {
    const { unsubscribe } = get()
    
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
    
    // Add small delay to ensure Firebase Auth is fully synced with Firestore
    setTimeout(async () => {
      try {
        // Ensure default group exists first
        await groupService.ensureDefaultGroup(user.uid)
        
        // Subscribe to real-time updates
        const newUnsubscribe = groupService.subscribeToGroups(user.uid, (groups) => {
          set({ groups, loading: false, error: null })
        })
        
        set({ unsubscribe: newUnsubscribe })
      } catch (error: any) {
        debugError('GroupStore: Failed to setup groups', error)
        set({ loading: false, error: 'Failed to load groups. Please try refreshing the page.' })
      }
    }, 500) // 500ms delay to ensure auth is synced
  },
  
  createGroup: async (userId, groupData) => {
    debugLog('GroupStore: Creating group', { userId, groupData })
    set({ loading: true, error: null })
    try {
      const result = await groupService.createGroup(userId, groupData)
      debugLog('GroupStore: Create group result', result)
      
      if (result.error) {
        debugError('GroupStore: Create group failed', result.error)
        set({ error: result.error, loading: false })
        throw new Error(result.error)
      } else {
        debugLog('GroupStore: Group created successfully', result.id)
        set({ loading: false })
      }
    } catch (error: any) {
      debugError('GroupStore: Create group exception', error)
      set({ error: error.message, loading: false })
      throw error
    }
  },
  
  updateGroup: async (userId, groupId, updates) => {
    try {
      const result = await groupService.updateGroup(userId, groupId, updates)
      if (result.error) {
        set({ error: result.error })
      }
    } catch (error: any) {
      const friendlyError = getFirebaseErrorMessage(error)
      set({ error: friendlyError })
    }
  },
  
  deleteGroup: async (userId, groupId) => {
    try {
      const result = await groupService.deleteGroup(userId, groupId)
      if (result.error) {
        set({ error: result.error })
        throw new Error(result.error)
      }
    } catch (error: any) {
      const friendlyError = getFirebaseErrorMessage(error)
      set({ error: friendlyError })
      throw error
    }
  },
  
  getGroupById: (groupId) => {
    const { groups } = get()
    return groups.find(group => group.id === groupId)
  },
  
  getDefaultGroup: () => {
    const { groups } = get()
    return groups.find(group => group.name === 'Default' || group.name === 'Nhóm mặc định') || {
      id: 'default',
      name: 'Default',
      color: '#6B7280',
      icon: '📋',
      userId: '',
      createdAt: new Date(),
    }
  },
}))