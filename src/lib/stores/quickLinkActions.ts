// Quick link-related store actions
import { storeLogger } from '$lib/utils/logger';
import {
  quickLinks,
  isLoading,
  loadingQuickLinks
} from './index';
import type {
  NewQuickLink,
  QuickLink
} from '$lib/types/database';
import { handleStoreError, clearStoreError } from './storeErrorHandling';

// QUICK LINKS ACTIONS
export async function loadQuickLinks(projectId: number) {
  loadingQuickLinks.set(true);
  clearStoreError();

  try {
    const response = await fetch(`/api/quick-links?project=${projectId}`);

    if (!response.ok) {
      throw new Error('Failed to load quick links');
    }

    const data = await response.json();
    quickLinks.set(data);
  } catch (err) {
    handleStoreError(err, 'Failed to load quick links');
  } finally {
    loadingQuickLinks.set(false);
  }
}

export async function createQuickLink(linkData: NewQuickLink) {
  isLoading.set(true);
  clearStoreError();

  try {
    const response = await fetch('/api/quick-links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(linkData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create quick link');
    }

    const newLink = await response.json();

    // Add to store
    quickLinks.update(list => [...list, newLink]);

    return newLink;
  } catch (err) {
    handleStoreError(err, 'Failed to create quick link');
    throw err;
  } finally {
    isLoading.set(false);
  }
}

export async function updateQuickLink(linkId: number, updates: Partial<QuickLink>) {
  isLoading.set(true);
  clearStoreError();

  try {
    const response = await fetch(`/api/quick-links/${linkId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update quick link');
    }

    const updatedLink = await response.json();

    // Update in store
    quickLinks.update(list =>
      list.map(link => link.id === linkId ? updatedLink : link)
    );

    return updatedLink;
  } catch (err) {
    handleStoreError(err, 'Failed to update quick link');
    throw err;
  } finally {
    isLoading.set(false);
  }
}

export async function deleteQuickLink(linkId: number) {
  isLoading.set(true);
  clearStoreError();

  try {
    const response = await fetch(`/api/quick-links/${linkId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete quick link');
    }

    // Remove from store
    quickLinks.update(list => list.filter(link => link.id !== linkId));

    return true;
  } catch (err) {
    handleStoreError(err, 'Failed to delete quick link');
    throw err;
  } finally {
    isLoading.set(false);
  }
}
