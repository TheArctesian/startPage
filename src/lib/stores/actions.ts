// Store actions following UNIX philosophy: each function does one thing well
import { get } from 'svelte/store';
import { storeLogger } from '$lib/utils/logger';
import {
  projects,
  tasks,
  timeSessions,
  quickLinks,
  activeProject,
  selectedTask,
  isLoading,
  loadingTasks,
  loadingQuickLinks,
  loadingSubProjects,
  error,
  projectTreeData
} from './index';
import type {
  NewProject,
  NewTask,
  NewQuickLink,
  QuickLink,
  Project,
  Task,
  IntensityLevel,
  ProjectTreeData,
  ProjectNode
} from '$lib/types/database';
import { buildProjectTree, compareProjectsByUpdatedAtDesc } from '$lib/utils/projectTree';

// Error handling helper
function handleError(err: any, message: string) {
  storeLogger.error(message, err);
  error.set(err.message || message);
  isLoading.set(false);
}

// Clear error helper
export function clearError() {
  error.set(null);
}

// PROJECT ACTIONS
export async function loadProjects(includeStats = false) {
  isLoading.set(true);
  clearError();
  
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
    handleError(err, 'Failed to load projects');
  } finally {
    isLoading.set(false);
  }
}

export async function createProject(projectData: NewProject) {
  isLoading.set(true);
  clearError();
  
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
    handleError(err, 'Failed to create project');
    throw err;
  } finally {
    isLoading.set(false);
  }
}

export async function updateProject(id: number, updates: Partial<Project>) {
  isLoading.set(true);
  clearError();
  
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
    handleError(err, 'Failed to update project');
    throw err;
  } finally {
    isLoading.set(false);
  }
}

export async function setActiveProject(project: Project) {
  storeLogger.info(`Setting active project: ${project.name} (ID: ${project.id})`);
  activeProject.set(project);
  // Load project-specific data and wait for completion
  await Promise.all([
    loadTasks(project.id),
    loadQuickLinks(project.id)
  ]);
  storeLogger.info(`Active project data loaded for: ${project.name}`);
}

// TASK ACTIONS
export async function loadTasks(projectId?: number) {
  loadingTasks.set(true);
  clearError();
  
  try {
    const url = projectId 
      ? `/api/tasks?project=${projectId}&details=true`
      : '/api/tasks?details=true';
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to load tasks');
    }
    
    const data = await response.json();
    storeLogger.debug(`Loaded ${data.length} tasks for project ${projectId}`, data);
    tasks.set(data);
  } catch (err) {
    handleError(err, 'Failed to load tasks');
  } finally {
    loadingTasks.set(false);
  }
}

export async function createTask(taskData: NewTask) {
  isLoading.set(true);
  clearError();
  
  try {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create task');
    }
    
    const newTask = await response.json();
    
    // Add to store
    tasks.update(list => [...list, newTask]);
    
    return newTask;
  } catch (err) {
    handleError(err, 'Failed to create task');
    throw err;
  } finally {
    isLoading.set(false);
  }
}

export async function updateTask(id: number, updates: Partial<Task>) {
  isLoading.set(true);
  clearError();
  
  try {
    const response = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update task');
    }
    
    const updatedTask = await response.json();
    
    // Update in store
    tasks.update(list => 
      list.map(t => t.id === id ? updatedTask : t)
    );
    
    return updatedTask;
  } catch (err) {
    handleError(err, 'Failed to update task');
    throw err;
  } finally {
    isLoading.set(false);
  }
}

export async function completeTask(id: number, actualIntensity: IntensityLevel) {
  isLoading.set(true);
  clearError();
  
  try {
    const response = await fetch(`/api/tasks/${id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actualIntensity })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to complete task');
    }
    
    const { task: completedTask, estimationAccuracy } = await response.json();
    
    // Update in store
    tasks.update(list => 
      list.map(t => t.id === id ? completedTask : t)
    );
    
    // Clear selected task if it was the completed one
    const current = get(selectedTask);
    if (current && current.id === id) {
      selectedTask.set(null);
    }

    return { task: completedTask, estimationAccuracy };
  } catch (err) {
    handleError(err, 'Failed to complete task');
    throw err;
  } finally {
    isLoading.set(false);
  }
}

export async function deleteTask(id: number) {
  isLoading.set(true);
  clearError();
  
  try {
    const response = await fetch(`/api/tasks/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete task');
    }
    
    // Remove from store
    tasks.update(list => list.filter(t => t.id !== id));
    
    // Clear selected task if it was the deleted one
    const current = get(selectedTask);
    if (current && current.id === id) {
      selectedTask.set(null);
    }

    return true;
  } catch (err) {
    handleError(err, 'Failed to delete task');
    throw err;
  } finally {
    isLoading.set(false);
  }
}

// QUICK LINKS ACTIONS
export async function loadQuickLinks(projectId: number) {
  loadingQuickLinks.set(true);
  clearError();
  
  try {
    const response = await fetch(`/api/quick-links?project=${projectId}`);
    
    if (!response.ok) {
      throw new Error('Failed to load quick links');
    }
    
    const data = await response.json();
    quickLinks.set(data);
  } catch (err) {
    handleError(err, 'Failed to load quick links');
  } finally {
    loadingQuickLinks.set(false);
  }
}

export async function createQuickLink(linkData: NewQuickLink) {
  isLoading.set(true);
  clearError();
  
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
    handleError(err, 'Failed to create quick link');
    throw err;
  } finally {
    isLoading.set(false);
  }
}

export async function updateQuickLink(linkId: number, updates: Partial<QuickLink>) {
  isLoading.set(true);
  clearError();
  
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
    handleError(err, 'Failed to update quick link');
    throw err;
  } finally {
    isLoading.set(false);
  }
}

export async function deleteQuickLink(linkId: number) {
  isLoading.set(true);
  clearError();
  
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
    handleError(err, 'Failed to delete quick link');
    throw err;
  } finally {
    isLoading.set(false);
  }
}

// UTILITY ACTIONS
export function setSelectedTask(task: Task | null) {
  selectedTask.set(task);
}

// TREE-SPECIFIC ACTIONS
export async function loadProjectTree(includeStats = true) {
  isLoading.set(true);
  clearError();
  
  try {
    const url = `/api/projects/tree${includeStats ? '?stats=true' : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to load project tree');
    }
    
    const treeData = await response.json();
    projectTreeData.set(treeData);
    
    return treeData;
  } catch (err) {
    handleError(err, 'Failed to load project tree');
  } finally {
    isLoading.set(false);
  }
}

export async function toggleProjectExpanded(projectId: number) {
  clearError();
  
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
    handleError(err, 'Failed to toggle project expansion');
    throw err;
  }
}

export async function createChildProject(parentId: number, projectData: Omit<NewProject, 'parentId'>) {
  isLoading.set(true);
  clearError();
  
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
    handleError(err, 'Failed to create child project');
    throw err;
  } finally {
    isLoading.set(false);
  }
}

export function refreshProjectTree() {
  return loadProjectTree(true);
}
