// Shared error handling utilities for store actions
// Extracted from projectActions, taskActions, and quickLinkActions

import { storeLogger } from '$lib/utils/logger';
import { error, isLoading } from './index';

/**
 * Handle errors in store actions
 * Logs the error, updates error store, and resets loading state
 */
export function handleStoreError(err: any, message: string) {
  storeLogger.error(message, err);
  error.set(err.message || message);
  isLoading.set(false);
}

/**
 * Clear the error store
 */
export function clearStoreError() {
  error.set(null);
}
