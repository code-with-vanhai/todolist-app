export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  startDate?: Date | null;
  dueDate?: Date | null;
  priority: Priority;
  status: TaskStatus;
  groupId?: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  isCompleted: boolean;
  completedAt?: Date | null;
}

export interface Group {
  id: string;
  name: string;
  color: string;
  icon?: string;
  userId: string;
  createdAt: Date;
  taskCount?: number;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  userId: string;
  createdAt: Date;
  taskCount?: number;
}

export interface TaskFilters {
  status?: TaskStatus[];
  priority?: Priority[];
  groupId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
}

export interface TaskSort {
  field: 'dueDate' | 'createdAt' | 'priority' | 'title';
  direction: 'asc' | 'desc';
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}