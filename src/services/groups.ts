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
} from 'firebase/firestore'
import { db } from './firebase'
import { Group } from '../types'
import { debugLog, debugError } from '../utils/debug'

// Firestore data conversion utilities
export const groupToFirestore = (group: Omit<Group, 'id' | 'userId'>) => {
  return {
    ...group,
    createdAt: Timestamp.fromDate(group.createdAt),
  }
}

export const firestoreToGroup = (doc: DocumentData, userId: string): Group => {
  const data = doc.data()
  return {
    id: doc.id,
    userId,
    ...data,
    createdAt: data.createdAt.toDate(),
  }
}

export class GroupService {
  private getGroupsCollection(userId: string) {
    return collection(db, 'users', userId, 'groups')
  }

  // Create a new group
  async createGroup(userId: string, groupData: Omit<Group, 'id' | 'userId' | 'createdAt'>) {
    try {
      debugLog('GroupService: Creating group', { userId, groupData })
      
      const group = {
        ...groupData,
        createdAt: new Date(),
      }

      const firestoreData = groupToFirestore(group)
      debugLog('GroupService: Firestore data', firestoreData)
      
      const docRef = await addDoc(this.getGroupsCollection(userId), firestoreData)
      debugLog('GroupService: Group created with ID', docRef.id)
      
      return { id: docRef.id, error: null }
    } catch (error: any) {
      debugError('GroupService: Create group failed', error)
      return { id: null, error: error.message }
    }
  }

  // Update an existing group
  async updateGroup(userId: string, groupId: string, updates: Partial<Group>) {
    try {
      const groupRef = doc(this.getGroupsCollection(userId), groupId)
      const updateData: any = {
        ...updates,
      }

      await updateDoc(groupRef, updateData)
      return { error: null }
    } catch (error: any) {
      return { error: error.message }
    }
  }

  // Delete a group
  async deleteGroup(userId: string, groupId: string) {
    try {
      const groupRef = doc(this.getGroupsCollection(userId), groupId)
      await deleteDoc(groupRef)
      return { error: null }
    } catch (error: any) {
      return { error: error.message }
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