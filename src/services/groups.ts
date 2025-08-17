import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  DocumentData,
  QuerySnapshot,
  serverTimestamp,
  setDoc,
  where,
  getDocs,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'
import { Group } from '../types'
import { debugLog, debugError } from '../utils/debug'
import { getFirebaseErrorMessage } from '../utils/errorHandler'

// Firestore data conversion utilities
export const groupToFirestore = (group: Omit<Group, 'id' | 'userId'>) => {
  return {
    ...group,
    createdAt: group.createdAt ? Timestamp.fromDate(group.createdAt) : serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
}

export const firestoreToGroup = (doc: DocumentData, userId: string): Group => {
  const data = doc.data()
  return {
    id: doc.id,
    userId,
    ...data,
    createdAt: data.createdAt?.toDate?.() || new Date(), // Defensive read
  }
}

export class GroupService {
  private getGroupsCollection(userId: string) {
    return collection(db, 'users', userId, 'groups')
  }

  // Ensure default group exists (idempotent)
  async ensureDefaultGroup(userId: string): Promise<string> {
    try {
      const defaultGroupRef = doc(db, 'users', userId, 'groups', 'default')
      await setDoc(defaultGroupRef, {
        name: 'Default',
        color: '#6B7280', 
        icon: '📋',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true })
      return 'default'
    } catch (error: any) {
      debugError('GroupService: Ensure default group failed', error)
      throw error
    }
  }

  // Create a new group
  async createGroup(userId: string, groupData: Omit<Group, 'id' | 'userId' | 'createdAt'>) {
    try {
      debugLog('GroupService: Creating group', { userId, groupData })
      
      const firestoreData = {
        ...groupData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
      
      debugLog('GroupService: Firestore data', firestoreData)
      
      const docRef = await addDoc(this.getGroupsCollection(userId), firestoreData)
      debugLog('GroupService: Group created with ID', docRef.id)
      
      return { id: docRef.id, error: null }
    } catch (error: any) {
      debugError('GroupService: Create group failed', error)
      const friendlyError = getFirebaseErrorMessage(error)
      return { id: null, error: friendlyError }
    }
  }

  // Update an existing group
  async updateGroup(userId: string, groupId: string, updates: Partial<Group>) {
    try {
      const groupRef = doc(this.getGroupsCollection(userId), groupId)
      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp(),
      }

      await updateDoc(groupRef, updateData)
      return { error: null }
    } catch (error: any) {
      const friendlyError = getFirebaseErrorMessage(error)
      return { error: friendlyError }
    }
  }

  // Delete a group
  async deleteGroup(userId: string, groupId: string) {
    if (groupId === 'default') {
      return { error: 'Không thể xóa nhóm mặc định' }
    }

    try {
      // 1. Ensure default group exists
      const defaultGroupId = await this.ensureDefaultGroup(userId)

      // 2. Get all tasks with this groupId
      const tasksQuery = query(
        collection(db, 'users', userId, 'tasks'),
        where('groupId', '==', groupId)
      )
      const tasksSnapshot = await getDocs(tasksQuery)

      // 3. Batch update tasks and delete group
      const batch = writeBatch(db)
      
      tasksSnapshot.docs.forEach(taskDoc => {
        batch.update(taskDoc.ref, { 
          groupId: defaultGroupId,
          updatedAt: serverTimestamp()
        })
      })

      // Delete the group
      const groupRef = doc(this.getGroupsCollection(userId), groupId)
      batch.delete(groupRef)

      await batch.commit()
      debugLog('GroupService: Group deleted and tasks moved to default', { groupId, tasksCount: tasksSnapshot.size })
      return { error: null }
    } catch (error: any) {
      debugError('GroupService: Delete group failed', error)
      const friendlyError = getFirebaseErrorMessage(error)
      return { error: friendlyError }
    }
  }

  // Subscribe to real-time group updates
  subscribeToGroups(userId: string, callback: (groups: Group[]) => void) {
    debugLog('GroupService: Subscribing to groups for user', userId)
    
    const q = query(
      this.getGroupsCollection(userId),
      orderBy('createdAt', 'asc')
    )

    return onSnapshot(q, 
      (snapshot: QuerySnapshot) => {
        debugLog('GroupService: Received snapshot', { 
          size: snapshot.size, 
          empty: snapshot.empty,
          changes: snapshot.docChanges().length 
        })
        
        const groups = snapshot.docs.map(doc => {
          const group = firestoreToGroup(doc, userId)
          debugLog('GroupService: Converted group', { id: group.id, name: group.name })
          return group
        })
        
        debugLog('GroupService: Calling callback with groups', groups.length)
        callback(groups)
      },
      (error) => {
        debugError('GroupService: Subscription error', error)
      }
    )
  }
}

export const groupService = new GroupService()