import { useState, useEffect } from 'react'
import { useTaskStore } from '../../stores/taskStore'
import { useGroupStore } from '../../stores/groupStore'
import { TaskStatus, Priority } from '../../types'
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline'

const TaskFilters = () => {
  const { filters, setFilters } = useTaskStore()
  const { fetchGroups } = useGroupStore()
  const [searchQuery, setSearchQuery] = useState(filters.searchQuery || '')

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  const handleStatusFilter = (status: TaskStatus) => {
    const currentStatuses = filters.status || []
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status]
    
    setFilters({ ...filters, status: newStatuses })
  }

  const handlePriorityFilter = (priority: Priority) => {
    const currentPriorities = filters.priority || []
    const newPriorities = currentPriorities.includes(priority)
      ? currentPriorities.filter(p => p !== priority)
      : [...currentPriorities, priority]
    
    setFilters({ ...filters, priority: newPriorities })
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setFilters({ ...filters, searchQuery: value || undefined })
  }

  const clearFilters = () => {
    setFilters({})
    setSearchQuery('')
  }

  const statusOptions = [
    { value: TaskStatus.TODO, label: 'To Do', color: 'bg-gray-100 text-gray-800' },
    { value: TaskStatus.IN_PROGRESS, label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
    { value: TaskStatus.COMPLETED, label: 'Completed', color: 'bg-green-100 text-green-800' },
    { value: TaskStatus.CANCELLED, label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  ]

  const priorityOptions = [
    { value: Priority.LOW, label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: Priority.MEDIUM, label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: Priority.HIGH, label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: Priority.URGENT, label: 'Urgent', color: 'bg-red-100 text-red-800' },
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
          <FunnelIcon className="w-5 h-5 mr-2" />
          Filters
        </h3>
        <button
          onClick={clearFilters}
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          Clear all
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Search
        </label>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Status Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Status
        </label>
        <div className="space-y-2">
          {statusOptions.map((option) => (
            <label key={option.value} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.status?.includes(option.value) || false}
                onChange={() => handleStatusFilter(option.value)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${option.color}`}>
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Priority Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Priority
        </label>
        <div className="space-y-2">
          {priorityOptions.map((option) => (
            <label key={option.value} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.priority?.includes(option.value) || false}
                onChange={() => handlePriorityFilter(option.value)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${option.color}`}>
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TaskFilters