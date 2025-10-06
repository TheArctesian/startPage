import { writable } from 'svelte/store';
import type { User } from '$lib/types/database';

export interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  canEdit: boolean;
  sessionId?: string;
}

// Default state for anonymous users
const defaultState: UserState = {
  user: null,
  isAuthenticated: false,
  isAnonymous: true,
  canEdit: false,
  sessionId: undefined
};

// Create the user state store
export const userState = writable<UserState>(defaultState);

// Helper functions to update state
export const userStateActions = {
  /**
   * Initialize user state from server data
   */
  initialize: (data: {
    user?: User | null;
    isAuthenticated?: boolean;
    isAnonymous?: boolean;
    canEdit?: boolean;
    sessionId?: string;
  }) => {
    userState.set({
      user: data.user || null,
      isAuthenticated: data.isAuthenticated || false,
      isAnonymous: data.isAnonymous !== false, // Default to true if not specified
      canEdit: data.canEdit || false,
      sessionId: data.sessionId
    });
  },

  /**
   * Clear user state (logout)
   */
  clear: () => {
    userState.set(defaultState);
  },

  /**
   * Update user data
   */
  updateUser: (user: User) => {
    userState.update(state => ({
      ...state,
      user,
      isAuthenticated: true,
      isAnonymous: false
    }));
  },

  /**
   * Update permissions
   */
  updatePermissions: (canEdit: boolean) => {
    userState.update(state => ({
      ...state,
      canEdit
    }));
  }
};

// Derived stores for common checks
export const isAuthenticated = {
  subscribe: (callback: (value: boolean) => void) => {
    return userState.subscribe(state => callback(state.isAuthenticated));
  }
};

export const isAnonymous = {
  subscribe: (callback: (value: boolean) => void) => {
    return userState.subscribe(state => callback(state.isAnonymous));
  }
};

export const canEdit = {
  subscribe: (callback: (value: boolean) => void) => {
    return userState.subscribe(state => callback(state.canEdit));
  }
};

export const currentUser = {
  subscribe: (callback: (value: User | null) => void) => {
    return userState.subscribe(state => callback(state.user));
  }
};