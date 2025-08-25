import { ArrowPathIcon, WifiIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useGroupStore } from '../../stores/groupStore'
import { useTaskStore } from '../../stores/taskStore'

const RealtimeStatus = () => {
  const { isRealtimeMode: groupsRealtime, refreshGroups, loading: groupsLoading } = useGroupStore()
  const { refreshTasks, loading: tasksLoading } = useTaskStore()

  const isRealtime = groupsRealtime // We can add task realtime status later
  const isLoading = groupsLoading || tasksLoading

  const handleRefresh = () => {
    refreshGroups()
    refreshTasks()
  }

  if (isRealtime) {
    return (
      <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
        <WifiIcon className="w-4 h-4" />
        <span>Live updates</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-sm">
        <ExclamationTriangleIcon className="w-4 h-4" />
        <span>Manual refresh mode</span>
      </div>
      <button
        onClick={handleRefresh}
        disabled={isLoading}
        className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Refresh data"
      >
        <ArrowPathIcon className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
        Refresh
      </button>
    </div>
  )
}

export default RealtimeStatus