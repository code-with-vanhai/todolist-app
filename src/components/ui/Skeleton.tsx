interface SkeletonProps {
  className?: string
  lines?: number
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', lines = 1 }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded h-4 mb-2 last:mb-0" />
      ))}
    </div>
  )
}

export const TaskSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow border-l-4 border-gray-300 p-6 animate-pulse">
    <div className="flex items-start space-x-3">
      <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      <div className="flex-1">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3"></div>
        <div className="flex space-x-2">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-24"></div>
        </div>
      </div>
      <div className="flex space-x-2">
        <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  </div>
)

export const TaskListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <TaskSkeleton key={i} />
    ))}
  </div>
)

export const GroupSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="flex items-center justify-between px-2 py-1.5 mb-2">
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
      </div>
      <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
    <div className="space-y-1">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between px-2 py-1.5">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
          </div>
          <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        </div>
      ))}
    </div>
  </div>
)

export const CalendarSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
      <div className="flex space-x-2">
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
    <div className="grid grid-cols-7 gap-1 mb-2">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
      ))}
    </div>
    <div className="grid grid-cols-7 gap-1">
      {Array.from({ length: 35 }).map((_, i) => (
        <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded p-2">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-6 mb-2"></div>
          <div className="space-y-1">
            <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
            <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
)