// Project and tree-related store actions
import { get } from 'svelte/store';
import { storeLogger } from '$lib/utils/logger';
import {
  projects,
  activeProject,
  isLoading,
  projectTreeData
} from './index';
import type {
  NewProject,
  Project,
  ProjectTreeData
} from '$lib/types/database';
import { buildProjectTree, compareProjectsByUpdatedAtDesc } from '$lib/utils/projectTree';
import { handleStoreError, clearStoreError } from './storeErrorHandling';
import { fetchProjectTree } from '$lib/api/projects';

// Export for backward compatibility
export { clearStoreError as clearError };

// PROJECT ACTIONS
export async function loadProjects(includeStats = false) {
  isLoading.set(true);
  clearStoreError();

  try {
    const url = `/api/projects${includeStats ? '?stats=true' : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to load projects');
    }

    const data = await response.json();
    const sortedProjects = Array.isArray(data)
      ? [...data].sort(compareProjectsByUpdatedAtDesc)
      : [];
    projects.set(sortedProjects);

    // Don't automatically set any project as active
    // Let users explicitly navigate to projects
  } catch (err) {
    handleStoreError(err, 'Failed to load projects');
  } finally {
    isLoading.set(false);
  }
}

export async function createProject(projectData: NewProject) {
  isLoading.set(true);
  clearStoreError();

  try {
    // Clean the project data to ensure only valid properties are sent
    const cleanProjectData: NewProject = {
      name: projectData.name,
      color: projectData.color,
      icon: projectData.icon,
      isActive: projectData.isActive,
      isPublic: projectData.isPublic,
      parentId: projectData.parentId,
      path: projectData.path,
      depth: projectData.depth,
      isExpanded: projectData.isExpanded
    };

    storeLogger.debug('Sending clean project data', cleanProjectData);

    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanProjectData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create project');
    }

    const newProject = await response.json();

    // Add to store
    projects.update(list => {
      const nextProjects = [...list, newProject];
      return nextProjects.sort(compareProjectsByUpdatedAtDesc);
    });

    // Set as active project
    activeProject.set(newProject);

    return newProject;
  } catch (err) {
    handleStoreError(err, 'Failed to create project');
    throw err;
  } finally {
    isLoading.set(false);
  }
}

export async function updateProject(id: number, updates: Partial<Project>) {
  isLoading.set(true);
  clearStoreError();

  try {
    const response = await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update project');
    }

    const updatedProject = await response.json();

    // Update in store
    projects.update(list => {
      const nextProjects = list.map(p => (p.id === id ? updatedProject : p));
      return nextProjects.sort(compareProjectsByUpdatedAtDesc);
    });

    // Update active project if it's the one being updated
    const current = get(activeProject);
    if (current && current.id === id) {
      activeProject.set(updatedProject);
    }

    return updatedProject;
  } catch (err) {
    handleStoreError(err, 'Failed to update project');
    throw err;
  } finally {
    isLoading.set(false);
  }
}

export async function setActiveProject(project: Project) {
  storeLogger.info(`Setting active project: ${project.name} (ID: ${project.id})`);
  activeProject.set(project);
  // Load project-specific data and wait for completion
  const { loadTasks } = await import('./taskActions');
  const { loadQuickLinks } = await import('./quickLinkActions');
  await Promise.all([
    loadTasks(project.id),
    loadQuickLinks(project.id)
  ]);
  storeLogger.info(`Active project data loaded for: ${project.name}`);
}

// TREE-SPECIFIC ACTIONS
export async function loadProjectTree(includeStats = true) {
  isLoading.set(true);
  clearStoreError();

  try {
    // Use fetchProjectTree which rebuilds flatMap and pathMap client-side
    const treeData = await fetchProjectTree(includeStats);
    projectTreeData.set(treeData);

    return treeData;
  } catch (err) {
    handleStoreError(err, 'Failed to load project tree');
  } finally {
    isLoading.set(false);
  }
}

export async function toggleProjectExpanded(projectId: number) {
  clearStoreError();

  try {
    const currentTreeData = get(projectTreeData);
    if (!currentTreeData) {
      throw new Error('No tree data available');
    }

    const node = currentTreeData.flatMap.get(projectId);
    if (!node) {
      throw new Error('Project not found in tree');
    }

    const newExpanded = !node.isExpanded;

    // Optimistically update local state
    node.isExpanded = newExpanded;
    projectTreeData.set({ ...currentTreeData });

    // Persist to backend
    const response = await fetch('/api/projects/tree', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        isExpanded: newExpanded
      })
    });

    if (!response.ok) {
      // Revert on error
      node.isExpanded = !newExpanded;
      projectTreeData.set({ ...currentTreeData });
      throw new Error('Failed to update project expansion state');
    }

    return newExpanded;
  } catch (err) {
    handleStoreError(err, 'Failed to toggle project expansion');
    throw err;
  }
}

export async function createChildProject(parentId: number, projectData: Omit<NewProject, 'parentId'>) {
  isLoading.set(true);
  clearStoreError();

  try {
    const newProjectData: NewProject = {
      ...projectData,
      parentId
    };

    const project = await createProject(newProjectData);

    // Reload tree data to reflect new hierarchy
    await loadProjectTree(true);

    return project;
  } catch (err) {
    handleStoreError(err, 'Failed to create child project');
    throw err;
  } finally {
    isLoading.set(false);
  }
}

export function refreshProjectTree() {
  return loadProjectTree(true);
}
