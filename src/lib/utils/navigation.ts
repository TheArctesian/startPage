import { goto } from '$app/navigation';
import type { ProjectNode, ProjectWithDetails } from '$lib/types/database';

/**
 * Generate project URL using ID-based routing
 * Simple, reliable approach that works with any project name
 */
export function generateProjectUrl(project: ProjectNode | ProjectWithDetails): string {
  return `/project/${project.id}`;
}

/**
 * Navigate to project using proper routing
 */
export async function navigateToProject(project: ProjectNode | ProjectWithDetails): Promise<void> {
  try {
    const url = generateProjectUrl(project);
    await goto(url);
  } catch (error) {
    console.error('❌ Navigation failed for project:', project.name);
    console.error('❌ Navigation error:', error);
    throw error;
  }
}

/**
 * Check if current route matches project
 */
export function isProjectRoute(project: ProjectNode | ProjectWithDetails, currentPath: string): boolean {
  const projectUrl = generateProjectUrl(project);
  return currentPath === projectUrl;
}

/**
 * Extract project ID from URL
 * Returns the project ID from a URL like "/project/123"
 */
export function getProjectIdFromUrl(url: string): number | null {
  const match = url.match(/^\/project\/(\d+)$/);
  return match ? parseInt(match[1]) : null;
}

/**
 * Navigate to home page
 */
export async function navigateToHome(): Promise<void> {
  await goto('/');
}