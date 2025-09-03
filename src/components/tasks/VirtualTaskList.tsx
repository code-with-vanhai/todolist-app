import { memo } from 'react'
import { Task } from '../../types'
import TaskItem from './TaskItem'

interface VirtualTaskListProps {
  tasks: Task[]
  height?: number
  itemSize?: number
  className?: string
}

const VirtualTaskList = memo(({
  tasks,
  className = ''
}: VirtualTaskListProps) => {

  // If we have few tasks, render normally to avoid virtual scrolling overhead
  if (tasks.length <= 10) {
    return (
      <div className={`space-y-4 ${className}`}>
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>
    )
  }

  // For now, fall back to regular rendering to avoid TypeScript issues
  // TODO: Implement proper virtual scrolling when react-window types are resolved
  return (
    <div className={`space-y-4 ${className}`}>
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}

      {/* Performance info for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          Virtual scrolling placeholder: {tasks.length} tasks (regular rendering)
        </div>
      )}
    </div>
  )
})

VirtualTaskList.displayName = 'VirtualTaskList'

export default VirtualTaskList
