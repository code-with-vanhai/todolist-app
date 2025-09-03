import { memo } from 'react'
import { useTaskStore } from '../../stores/taskStore'
import TaskItem from './TaskItem'
import VirtualTaskList from './VirtualTaskList'
import { TaskListSkeleton } from '../ui/Skeleton'

const TaskList = memo(() => {
  const { getFilteredTasks, loading } = useTaskStore()
  const tasks = getFilteredTasks()

  if (loading) {
    return <TaskListSkeleton count={5} />
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          Không tìm thấy task nào. Tạo task đầu tiên để bắt đầu!
        </p>
      </div>
    )
  }

  // Use virtual scrolling for large lists (>20 items) for better performance
  if (tasks.length > 20) {
    return (
      <VirtualTaskList
        tasks={tasks}
        height={600}
        itemSize={140}
        className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
      />
    )
  }

  // Use normal rendering for smaller lists to avoid virtual scrolling overhead
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="space-y-4">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>
    </div>
  )
})

export default TaskList