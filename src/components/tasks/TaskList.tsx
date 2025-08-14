import { useTaskStore } from '../../stores/taskStore'
import TaskItem from './TaskItem'

const TaskList = () => {
  const { getFilteredTasks } = useTaskStore()
  const tasks = getFilteredTasks()

  if (tasks.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          No tasks found. Create your first task to get started!
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