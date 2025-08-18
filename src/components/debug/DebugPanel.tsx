import { useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { useGroupStore } from '../../stores/groupStore'
import { useTaskStore } from '../../stores/taskStore'
import { checkFirebaseConfig } from '../../utils/debug'
import { Priority, TaskStatus } from '../../types'
import { collection, getDocs, doc, deleteDoc, updateDoc, query, where } from 'firebase/firestore'
import { db } from '../../services/firebase'

const DebugPanel = () => {
  const { user } = useAuthStore()
  const { groups } = useGroupStore()
  const { tasks, loading, error, createTask } = useTaskStore()
  const [showDebug, setShowDebug] = useState(false)
  const [testLoading, setTestLoading] = useState(false)
  const [cleanupLoading, setCleanupLoading] = useState(false)
  const [cleanupResult, setCleanupResult] = useState<string | null>(null)

  const testCreateTask = async () => {
    if (!user) {
      alert('No user logged in!')
      return
    }

    setTestLoading(true)
    try {
      await createTask(user.uid, {
        title: `Test Task ${Date.now()}`,
        description: 'This is a test task created from debug panel',
        priority: Priority.MEDIUM,
        status: TaskStatus.TODO,
        isCompleted: false,
      })
      alert('Test task created successfully!')
    } catch (error: any) {
      alert(`Failed to create test task: ${error.message}`)
    } finally {
      setTestLoading(false)
    }
  }

  const cleanupDuplicateGroups = async () => {
    if (!user) {
      alert('No user logged in!')
      return
    }

    setCleanupLoading(true)
    setCleanupResult(null)
    
    try {
      // Lấy tất cả groups của user
      const groupsRef = collection(db, 'users', user.uid, 'groups')
      const snapshot = await getDocs(groupsRef)
      
      const allGroups: any[] = []
      snapshot.forEach(doc => {
        allGroups.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date()
        })
      })
      
      // Tìm tất cả default groups (cả "Default" và "Nhóm mặc định")
      const defaultGroups = allGroups.filter(group => 
        group.name === 'Default' || group.name === 'Nhóm mặc định'
      )
      
      if (defaultGroups.length <= 1) {
        setCleanupResult(`✅ Không có duplicate default groups (tổng: ${allGroups.length} groups, default groups: ${defaultGroups.length})`)
        return
      }

      // Quyết định group nào sẽ giữ lại và đảm bảo tên là "Default"
      let keepGroup
      const officialDefaultGroup = defaultGroups.find(g => g.id === 'default')
      if (officialDefaultGroup) {
        keepGroup = officialDefaultGroup
      } else {
        // Giữ group được tạo sớm nhất
        defaultGroups.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        keepGroup = defaultGroups[0]
      }

      // Đảm bảo group được giữ lại có tên là "Default"
      if (keepGroup.name !== 'Default') {
        try {
          const keepGroupRef = doc(db, 'users', user.uid, 'groups', keepGroup.id)
          await updateDoc(keepGroupRef, { name: 'Default' })
          console.log(`Đã đổi tên group ${keepGroup.id} thành "Default"`)
        } catch (error) {
          console.error(`Lỗi khi đổi tên group ${keepGroup.id}:`, error)
        }
      }

      // Chuyển tất cả tasks từ các groups duplicate về group được giữ lại
      let movedTasksCount = 0
      for (const group of defaultGroups) {
        if (group.id !== keepGroup.id) {
          try {
            // Tìm tất cả tasks thuộc group này
            const tasksQuery = query(
              collection(db, 'users', user.uid, 'tasks'),
              where('groupId', '==', group.id)
            )
            const tasksSnapshot = await getDocs(tasksQuery)
            
            // Chuyển tasks về group được giữ lại
            for (const taskDoc of tasksSnapshot.docs) {
              await updateDoc(taskDoc.ref, { 
                groupId: keepGroup.id,
                updatedAt: new Date()
              })
              movedTasksCount++
            }
            
            // Xóa group duplicate
            const groupRef = doc(db, 'users', user.uid, 'groups', group.id)
            await deleteDoc(groupRef)
            console.log(`Đã xóa duplicate group: ${group.id} và chuyển ${tasksSnapshot.size} tasks`)
          } catch (error) {
            console.error(`Lỗi khi xử lý group ${group.id}:`, error)
          }
        }
      }

      const deletedCount = defaultGroups.length - 1

      setCleanupResult(`🎉 Đã dọn dẹp thành công! Xóa ${deletedCount} duplicate groups, chuyển ${movedTasksCount} tasks, giữ lại: ${keepGroup.id}`)
      
    } catch (error: any) {
      console.error('Error cleaning up groups:', error)
      setCleanupResult(`❌ Lỗi: ${error.message}`)
    } finally {
      setCleanupLoading(false)
    }
  }

  const firebaseConfigOk = checkFirebaseConfig()

  if (!showDebug) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setShowDebug(true)}
          className="bg-red-500 text-white px-3 py-2 rounded-lg text-sm"
        >
          Debug
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4 max-w-sm shadow-lg">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-sm">Debug Panel</h3>
        <button
          onClick={() => setShowDebug(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 text-xs">
        <div>
          <strong>Firebase Config:</strong>{' '}
          <span className={firebaseConfigOk ? 'text-green-600' : 'text-red-600'}>
            {firebaseConfigOk ? '✓ OK' : '✗ Missing'}
          </span>
        </div>

        <div>
          <strong>User:</strong>{' '}
          <span className={user ? 'text-green-600' : 'text-red-600'}>
            {user ? `✓ ${user.email}` : '✗ Not logged in'}
          </span>
        </div>

        <div>
          <strong>Groups:</strong> {groups.length} loaded
          {(() => {
            const defaultGroups = groups.filter(g => g.name === 'Default' || g.name === 'Nhóm mặc định')
            return defaultGroups.length > 1 && (
              <span className="text-red-600 ml-1">⚠️ {defaultGroups.length} default groups!</span>
            )
          })()}
        </div>

        <div>
          <strong>Tasks:</strong> {tasks.length} loaded
        </div>

        <div>
          <strong>Loading:</strong>{' '}
          <span className={loading ? 'text-yellow-600' : 'text-green-600'}>
            {loading ? 'Yes' : 'No'}
          </span>
        </div>

        {error && (
          <div>
            <strong>Error:</strong>{' '}
            <span className="text-red-600 break-words">{error}</span>
          </div>
        )}

        <div className="pt-2 border-t space-y-2">
          <button
            onClick={testCreateTask}
            disabled={testLoading || !user}
            className="w-full bg-blue-500 text-white px-3 py-1 rounded text-xs disabled:opacity-50"
          >
            {testLoading ? 'Creating...' : 'Test Create Task'}
          </button>
          
          <button
            onClick={cleanupDuplicateGroups}
            disabled={cleanupLoading || !user}
            className="w-full bg-red-500 text-white px-3 py-1 rounded text-xs disabled:opacity-50"
          >
            {cleanupLoading ? 'Cleaning...' : 'Cleanup Duplicate Groups'}
          </button>
          
          {cleanupResult && (
            <div className="text-xs p-2 bg-gray-100 dark:bg-gray-700 rounded">
              {cleanupResult}
            </div>
          )}
        </div>

        <div className="text-xs text-gray-500">
          Check browser console for detailed logs
        </div>
      </div>
    </div>
  )
}

export default DebugPanel