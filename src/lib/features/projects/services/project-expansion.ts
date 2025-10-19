type ProjectTarget = number | number[];

/**
 * Project expansion persistence helper.
 *
 * Provides a single entry point for updating a project's expanded / collapsed
 * state in the backend so UI components don't duplicate fetch logic.
 */
export async function setProjectExpansion(target: ProjectTarget, isExpanded: boolean): Promise<void> {
  if (Array.isArray(target)) {
    const projectIds = target.filter(
      (id): id is number => typeof id === 'number' && Number.isFinite(id)
    );

    if (projectIds.length === 0) {
      return;
    }

    await updateMultipleProjectExpansion(projectIds, isExpanded);
    return;
  }

  await updateSingleProjectExpansion(target, isExpanded);
}

async function updateMultipleProjectExpansion(projectIds: number[], isExpanded: boolean): Promise<void> {
  const response = await fetch('/api/projects/tree', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectIds, isExpanded })
  });

  if (!response.ok) {
    const message = await extractErrorMessage(response);
    throw new Error(message ?? 'Failed to update project expansion state');
  }
}

async function updateSingleProjectExpansion(projectId: number, isExpanded: boolean): Promise<void> {
  const response = await fetch('/api/projects/tree', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, isExpanded })
  });

  if (!response.ok) {
    const message = await extractErrorMessage(response);
    throw new Error(message ?? 'Failed to update project expansion state');
  }
}

async function extractErrorMessage(response: Response): Promise<string | null> {
  try {
    const data = await response.json();
    if (typeof data?.error === 'string' && data.error.trim().length > 0) {
      return data.error;
    }
  } catch {
    // Ignore JSON parsing errors and fall back to status text
  }

  if (response.statusText) {
    return response.statusText;
  }

  return null;
}
