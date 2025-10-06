export interface DueDateFormat {
  text: string;
  class: 'overdue' | 'due-today' | 'due-soon' | 'due-later';
  urgent?: boolean;
}

export function formatDueDate(date: Date | string | null): DueDateFormat | string {
  if (!date) return '';
  
  const dueDate = new Date(date);
  const now = new Date();
  const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { 
      text: `${Math.abs(diffDays)}d overdue`, 
      class: 'overdue', 
      urgent: true 
    };
  } else if (diffDays === 0) {
    return { 
      text: 'Due today', 
      class: 'due-today', 
      urgent: true 
    };
  } else if (diffDays === 1) {
    return { 
      text: 'Due tomorrow', 
      class: 'due-soon', 
      urgent: false 
    };
  } else if (diffDays <= 7) {
    return { 
      text: `Due in ${diffDays}d`, 
      class: 'due-soon', 
      urgent: false 
    };
  } else {
    return { 
      text: `Due in ${diffDays}d`, 
      class: 'due-later', 
      urgent: false 
    };
  }
}

export function formatRelativeTime(date: Date | string): string {
  const targetDate = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - targetDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 0) {
    return `${diffDays}d ago`;
  } else if (diffHours > 0) {
    return `${diffHours}h ago`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes}m ago`;
  } else {
    return 'Just now';
  }
}

export function formatDateDisplay(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
}

export function formatDateTimeDisplay(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}