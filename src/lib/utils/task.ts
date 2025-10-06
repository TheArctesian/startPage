export interface StatusConfig {
  label: string;
  icon: string;
  color: string;
  bgColor?: string;
}

export interface PriorityConfig {
  label: string;
  color: string;
  icon?: string;
}

export const statusConfig: Record<string, StatusConfig> = {
  todo: { 
    label: 'To Do', 
    icon: 'circle-empty', 
    color: 'var(--nord4)',
    bgColor: 'var(--nord2)'
  },
  in_progress: { 
    label: 'In Progress', 
    icon: 'circle-progress', 
    color: 'var(--nord8)',
    bgColor: 'rgba(136, 192, 208, 0.1)'
  },
  done: { 
    label: 'Done', 
    icon: 'circle-check', 
    color: 'var(--nord14)',
    bgColor: 'rgba(163, 190, 140, 0.1)'
  },
  archived: { 
    label: 'Archived', 
    icon: 'archive', 
    color: 'var(--nord3)',
    bgColor: 'var(--nord1)'
  }
};

export const priorityConfig: Record<string, PriorityConfig> = {
  low: { 
    label: 'Low', 
    color: 'var(--nord4)', 
    icon: 'flag' 
  },
  medium: { 
    label: 'Medium', 
    color: 'var(--nord8)', 
    icon: 'flag' 
  },
  high: { 
    label: 'High', 
    color: 'var(--nord12)', 
    icon: 'flag' 
  }
};

export function getStatusConfig(status: string): StatusConfig {
  return statusConfig[status] || statusConfig.todo;
}

export function getPriorityConfig(priority: string): PriorityConfig {
  return priorityConfig[priority] || priorityConfig.medium;
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high':
      return 'var(--nord11)';
    case 'medium':
      return 'var(--nord13)';
    case 'low':
      return 'var(--nord4)';
    default:
      return 'var(--nord4)';
  }
}

export function getPriorityIndicator(priority: string): string {
  switch (priority) {
    case 'high':
      return '!';
    case 'medium':
      return '•';
    case 'low':
      return '·';
    default:
      return '·';
  }
}

export function getTaskStatusDisplayName(status: string): string {
  return statusConfig[status]?.label || status;
}

export function getTaskPriorityDisplayName(priority: string): string {
  return priorityConfig[priority]?.label || priority;
}