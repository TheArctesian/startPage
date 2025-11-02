import type { QuickLink, NewQuickLink, QuickLinkFormData } from '$lib/types/database';

/**
 * Fetch all quick links for a project
 * @param projectId - Project ID to fetch links for
 */
export async function fetchQuickLinks(projectId: number): Promise<QuickLink[]> {
	const res = await fetch(`/api/quick-links?projectId=${projectId}`);
	if (!res.ok) throw new Error(`Failed to fetch quick links: ${res.status}`);
	return res.json();
}

/**
 * Fetch a single quick link by ID
 */
export async function fetchQuickLink(id: number): Promise<QuickLink> {
	const res = await fetch(`/api/quick-links/${id}`);
	if (!res.ok) throw new Error(`Failed to fetch quick link: ${res.status}`);
	return res.json();
}

/**
 * Create a new quick link
 */
export async function createQuickLink(data: NewQuickLink | QuickLinkFormData): Promise<QuickLink> {
	const res = await fetch('/api/quick-links', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	});
	if (!res.ok) throw new Error(`Failed to create quick link: ${res.status}`);
	return res.json();
}

/**
 * Update an existing quick link
 */
export async function updateQuickLink(id: number, data: Partial<QuickLink>): Promise<QuickLink> {
	const res = await fetch(`/api/quick-links/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	});
	if (!res.ok) throw new Error(`Failed to update quick link: ${res.status}`);
	return res.json();
}

/**
 * Delete a quick link
 */
export async function deleteQuickLink(id: number): Promise<void> {
	const res = await fetch(`/api/quick-links/${id}`, { method: 'DELETE' });
	if (!res.ok) throw new Error(`Failed to delete quick link: ${res.status}`);
}
