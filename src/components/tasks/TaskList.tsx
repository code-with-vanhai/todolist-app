import { useTaskStore } from '../../stores/taskStore'
import TaskItem from './TaskItem'
import { TaskListSkeleton } from '../ui/Skeleton'

const TaskList = () => {
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

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </div>
  )
}

export default TaskList