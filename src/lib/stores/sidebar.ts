/**
 * Global Sidebar State Store
 * 
 * Manages sidebar state across navigation to prevent re-hydration
 * and provide smooth transitions between pages.
 */

import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import type { ProjectWithDetails } from '$lib/types/database';

// Sidebar state interface
interface SidebarState {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  activeProjectId: number | null;
  expandedProjectIds: Set<number>;
  scrollPosition: number;
}

// Initial state
const initialState: SidebarState = {
  isCollapsed: false,
  isMobileOpen: false,
  activeProjectId: null,
  expandedProjectIds: new Set(),
  scrollPosition: 0
};

// Create the main sidebar store
export const sidebarState = writable<SidebarState>(initialState);

// Derived stores for easy access to specific state
export const isCollapsed = derived(sidebarState, $state => $state.isCollapsed);
export const isMobileOpen = derived(sidebarState, $state => $state.isMobileOpen);
export const activeProjectId = derived(sidebarState, $state => $state.activeProjectId);
export const expandedProjectIds = derived(sidebarState, $state => $state.expandedProjectIds);

// Actions to update sidebar state
export const sidebarActions = {
  /**
   * Toggle sidebar collapsed state (desktop)
   */
  toggleCollapsed() {
    sidebarState.update(state => ({
      ...state,
      isCollapsed: !state.isCollapsed
    }));
  },

  /**
   * Set collapsed state explicitly
   */
  setCollapsed(collapsed: boolean) {
    sidebarState.update(state => ({
      ...state,
      isCollapsed: collapsed
    }));
  },

  /**
   * Toggle mobile sidebar open state
   */
  toggleMobileOpen() {
    sidebarState.update(state => ({
      ...state,
      isMobileOpen: !state.isMobileOpen
    }));
  },

  /**
   * Set mobile open state explicitly
   */
  setMobileOpen(open: boolean) {
    sidebarState.update(state => ({
      ...state,
      isMobileOpen: open
    }));
  },

  /**
   * Close mobile sidebar (common action)
   */
  closeMobile() {
    this.setMobileOpen(false);
  },

  /**
   * Set active project
   */
  setActiveProject(projectId: number | null) {
    sidebarState.update(state => ({
      ...state,
      activeProjectId: projectId
    }));
  },

  /**
   * Toggle project expanded state in tree
   */
  toggleProjectExpanded(projectId: number) {
    sidebarState.update(state => {
      const newExpanded = new Set(state.expandedProjectIds);
      if (newExpanded.has(projectId)) {
        newExpanded.delete(projectId);
      } else {
        newExpanded.add(projectId);
      }
      return {
        ...state,
        expandedProjectIds: newExpanded
      };
    });
  },

  /**
   * Set project expanded state explicitly
   */
  setProjectExpanded(projectId: number, expanded: boolean) {
    sidebarState.update(state => {
      const newExpanded = new Set(state.expandedProjectIds);
      if (expanded) {
        newExpanded.add(projectId);
      } else {
        newExpanded.delete(projectId);
      }
      return {
        ...state,
        expandedProjectIds: newExpanded
      };
    });
  },

  /**
   * Save scroll position
   */
  saveScrollPosition(position: number) {
    sidebarState.update(state => ({
      ...state,
      scrollPosition: position
    }));
  },

  /**
   * Restore scroll position (returns the saved position)
   */
  getScrollPosition(): number {
    let position = 0;
    sidebarState.subscribe(state => {
      position = state.scrollPosition;
    })();
    return position;
  },

  /**
   * Reset sidebar state to defaults
   */
  reset() {
    sidebarState.set(initialState);
  },

  /**
   * Initialize sidebar from localStorage (browser only)
   */
  loadFromStorage() {
    if (!browser) return;
    
    try {
      const stored = localStorage.getItem('sidebar-state');
      if (stored) {
        const parsed = JSON.parse(stored);
        sidebarState.update(state => ({
          ...state,
          isCollapsed: parsed.isCollapsed ?? state.isCollapsed,
          expandedProjectIds: new Set(parsed.expandedProjectIds ?? []),
          // Don't restore mobile or scroll state from storage
        }));
      }
    } catch (error) {
      console.warn('Failed to load sidebar state from localStorage:', error);
    }
  },

  /**
   * Save sidebar state to localStorage (browser only)
   */
  saveToStorage() {
    if (!browser) return;
    
    sidebarState.subscribe(state => {
      try {
        const toStore = {
          isCollapsed: state.isCollapsed,
          expandedProjectIds: Array.from(state.expandedProjectIds),
          // Don't persist mobile or scroll state
        };
        localStorage.setItem('sidebar-state', JSON.stringify(toStore));
      } catch (error) {
        console.warn('Failed to save sidebar state to localStorage:', error);
      }
    })();
  }
};

// Auto-save to localStorage when state changes (browser only)
if (browser) {
  sidebarState.subscribe(() => {
    sidebarActions.saveToStorage();
  });
}

// Initialize from storage on first load
if (browser) {
  sidebarActions.loadFromStorage();
}

// Convenience functions for responsive behavior
export const responsiveActions = {
  /**
   * Handle window resize - close mobile sidebar if window becomes large
   */
  handleResize() {
    if (!browser) return;
    
    if (window.innerWidth > 1024) {
      sidebarActions.setMobileOpen(false);
    }
  },

  /**
   * Close mobile sidebar when navigating (common UX pattern)
   */
  handleNavigation() {
    if (!browser) return;
    
    if (window.innerWidth <= 1024) {
      sidebarActions.closeMobile();
    }
  }
};

// Set up window resize listener (browser only)
if (browser) {
  window.addEventListener('resize', responsiveActions.handleResize);
}