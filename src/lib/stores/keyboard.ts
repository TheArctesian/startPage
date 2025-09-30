/**
 * Keyboard Shortcuts Store
 * 
 * Centralized keyboard event handling following UNIX philosophy:
 * - Single responsibility: Only handles keyboard shortcuts
 * - Composable: Shortcuts can be registered/unregistered dynamically
 * - Predictable: Consistent key combinations and behaviors
 */

import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

// Types for keyboard shortcuts
export interface KeyboardShortcut {
  id: string;
  key: string;
  modifiers?: {
    ctrl?: boolean;
    cmd?: boolean;
    alt?: boolean;
    shift?: boolean;
  };
  description: string;
  action: () => void;
  enabled?: boolean;
  context?: string; // Optional context for conditional shortcuts
}

interface KeyboardState {
  shortcuts: KeyboardShortcut[];
  isEnabled: boolean;
  activeContext: string | null;
}

// Initial state
const initialState: KeyboardState = {
  shortcuts: [],
  isEnabled: true,
  activeContext: null
};

// Main keyboard store
export const keyboardStore = writable<KeyboardState>(initialState);

// Derived stores for easier access
export const shortcuts = derived(
  keyboardStore,
  ($keyboard) => $keyboard.shortcuts
);

export const isKeyboardEnabled = derived(
  keyboardStore,
  ($keyboard) => $keyboard.isEnabled
);

// Key combination checker
function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  // Check if main key matches
  if (event.key.toLowerCase() !== shortcut.key.toLowerCase()) {
    return false;
  }

  // Check modifiers
  const modifiers = shortcut.modifiers || {};
  
  // Handle Cmd (Mac) vs Ctrl (Windows/Linux)
  const cmdOrCtrl = modifiers.cmd || modifiers.ctrl;
  const metaPressed = event.metaKey || event.ctrlKey;
  
  if (cmdOrCtrl && !metaPressed) return false;
  if (!cmdOrCtrl && metaPressed) return false;
  
  if (modifiers.alt && !event.altKey) return false;
  if (!modifiers.alt && event.altKey) return false;
  
  if (modifiers.shift && !event.shiftKey) return false;
  if (!modifiers.shift && event.shiftKey) return false;

  return true;
}

// Context checker
function isShortcutActiveInContext(shortcut: KeyboardShortcut, activeContext: string | null): boolean {
  if (!shortcut.context) return true; // Global shortcuts always active
  return shortcut.context === activeContext;
}

// Register a keyboard shortcut
export function registerShortcut(shortcut: KeyboardShortcut): void {
  keyboardStore.update(state => ({
    ...state,
    shortcuts: [...state.shortcuts.filter(s => s.id !== shortcut.id), shortcut]
  }));
}

// Unregister a keyboard shortcut
export function unregisterShortcut(id: string): void {
  keyboardStore.update(state => ({
    ...state,
    shortcuts: state.shortcuts.filter(s => s.id !== id)
  }));
}

// Set keyboard context (e.g., 'modal', 'kanban', 'timer')
export function setKeyboardContext(context: string | null): void {
  keyboardStore.update(state => ({
    ...state,
    activeContext: context
  }));
}

// Enable/disable keyboard shortcuts globally
export function setKeyboardEnabled(enabled: boolean): void {
  keyboardStore.update(state => ({
    ...state,
    isEnabled: enabled
  }));
}

// Main keyboard event handler
function handleKeyboardEvent(event: KeyboardEvent): void {
  if (!browser) return;

  keyboardStore.subscribe(state => {
    if (!state.isEnabled) return;

    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    // Find matching shortcuts
    const matchingShortcuts = state.shortcuts.filter(shortcut => {
      return (
        shortcut.enabled !== false &&
        matchesShortcut(event, shortcut) &&
        isShortcutActiveInContext(shortcut, state.activeContext)
      );
    });

    // Execute first matching shortcut
    if (matchingShortcuts.length > 0) {
      event.preventDefault();
      event.stopPropagation();
      matchingShortcuts[0].action();
    }
  });
}

// Initialize keyboard event listeners
if (browser) {
  document.addEventListener('keydown', handleKeyboardEvent);
}

// Cleanup function for SSR compatibility
export function cleanupKeyboardListeners(): void {
  if (browser) {
    document.removeEventListener('keydown', handleKeyboardEvent);
  }
}

// Helper function to format key combination for display
export function formatKeyCombo(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  const modifiers = shortcut.modifiers || {};

  // Determine platform-specific modifier keys
  const isMac = browser && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  
  if (modifiers.ctrl && !isMac) parts.push('Ctrl');
  if (modifiers.cmd && isMac) parts.push('Cmd');
  if (modifiers.cmd && !isMac) parts.push('Ctrl'); // Show Ctrl for non-Mac
  if (modifiers.alt) parts.push(isMac ? 'Option' : 'Alt');
  if (modifiers.shift) parts.push('Shift');
  
  parts.push(shortcut.key.toUpperCase());
  
  return parts.join(isMac ? ' + ' : ' + ');
}

// Predefined shortcuts for the productivity app
export const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  {
    id: 'timer-toggle',
    key: ' ', // Space bar
    description: 'Start/pause timer',
    action: () => {
      // Will be implemented by Timer component
      const event = new CustomEvent('shortcut:timer-toggle');
      document.dispatchEvent(event);
    }
  },
  {
    id: 'new-task',
    key: 'n',
    modifiers: { cmd: true },
    description: 'Create new task',
    action: () => {
      const event = new CustomEvent('shortcut:new-task');
      document.dispatchEvent(event);
    }
  },
  {
    id: 'search-tasks',
    key: 'k',
    modifiers: { cmd: true },
    description: 'Search tasks',
    action: () => {
      const event = new CustomEvent('shortcut:search-tasks');
      document.dispatchEvent(event);
    }
  },
  {
    id: 'toggle-sidebar',
    key: 'b',
    modifiers: { cmd: true },
    description: 'Toggle project sidebar',
    action: () => {
      const event = new CustomEvent('shortcut:toggle-sidebar');
      document.dispatchEvent(event);
    }
  },
  {
    id: 'toggle-links',
    key: 'l',
    modifiers: { cmd: true },
    description: 'Toggle quick links',
    action: () => {
      const event = new CustomEvent('shortcut:toggle-links');
      document.dispatchEvent(event);
    }
  },
  {
    id: 'escape',
    key: 'Escape',
    description: 'Close modal/cancel action',
    action: () => {
      const event = new CustomEvent('shortcut:escape');
      document.dispatchEvent(event);
    }
  },
  {
    id: 'save',
    key: 's',
    modifiers: { cmd: true },
    description: 'Save current form',
    context: 'modal',
    action: () => {
      const event = new CustomEvent('shortcut:save');
      document.dispatchEvent(event);
    }
  },
  {
    id: 'delete-task',
    key: 'Delete',
    description: 'Delete selected task',
    context: 'kanban',
    action: () => {
      const event = new CustomEvent('shortcut:delete-task');
      document.dispatchEvent(event);
    }
  },
  {
    id: 'edit-task',
    key: 'Enter',
    description: 'Edit selected task',
    context: 'kanban',
    action: () => {
      const event = new CustomEvent('shortcut:edit-task');
      document.dispatchEvent(event);
    }
  },
  {
    id: 'complete-task',
    key: 'c',
    description: 'Complete selected task',
    context: 'kanban',
    action: () => {
      const event = new CustomEvent('shortcut:complete-task');
      document.dispatchEvent(event);
    }
  }
];

// Initialize default shortcuts
export function initializeDefaultShortcuts(): void {
  DEFAULT_SHORTCUTS.forEach(shortcut => {
    registerShortcut(shortcut);
  });
}

// Shortcut help modal data
export const shortcutCategories = derived(shortcuts, ($shortcuts) => {
  const categories: Record<string, KeyboardShortcut[]> = {
    'Global': [],
    'Timer': [],
    'Tasks': [],
    'Navigation': []
  };

  $shortcuts.forEach(shortcut => {
    if (shortcut.id.includes('timer')) {
      categories.Timer.push(shortcut);
    } else if (shortcut.id.includes('task') || shortcut.context === 'kanban') {
      categories.Tasks.push(shortcut);
    } else if (shortcut.id.includes('toggle') || shortcut.id.includes('search')) {
      categories.Navigation.push(shortcut);
    } else {
      categories.Global.push(shortcut);
    }
  });

  return categories;
});

// Utility to check if user is on Mac
export const isMac = browser && navigator.platform.toUpperCase().indexOf('MAC') >= 0;