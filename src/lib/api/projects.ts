import type {
	Project,
	NewProject,
	ProjectWithDetails,
	ProjectUser,
	PermissionLevel,
	ProjectTreeData,
	ProjectNode
} from '$lib/types/database';

/**
 * Rebuilds flatMap and pathMap from a tree of nodes
 */
function rebuildMaps(roots: ProjectNode[]): { flatMap: Map<number, ProjectNode>; pathMap: Map<string, ProjectNode> } {
	const flatMap = new Map<number, ProjectNode>();
	const pathMap = new Map<string, ProjectNode>();

	function traverse(nodes: ProjectNode[]) {
		for (const node of nodes) {
			flatMap.set(node.id, node);
			pathMap.set(node.breadcrumb, node);
			if (node.children && node.children.length > 0) {
				traverse(node.children);
			}
		}
	}

	traverse(roots);
	return { flatMap, pathMap };
}

/**
 * Fetch all projects with optional stats
 * @param includeStats - Whether to include task statistics
 */
export async function fetchProjects(includeStats = false): Promise<ProjectWithDetails[]> {
	const res = await fetch(`/api/projects${includeStats ? '?stats=true' : ''}`);
	if (!res.ok) throw new Error(`Failed to fetch projects: ${res.status}`);
	return res.json();
}

/**
 * Fetch hierarchical project tree data
 * @param includeStats - Whether to include task statistics (default: true)
 */
export async function fetchProjectTree(includeStats = true): Promise<ProjectTreeData> {
	const url = `/api/projects/tree${includeStats ? '?stats=true' : '?stats=false'}`;
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Failed to fetch project tree: ${res.status}`);
	const data = await res.json() as { roots: ProjectNode[]; maxDepth: number };

	// Rebuild Maps client-side
	const { flatMap, pathMap } = rebuildMaps(data.roots);

	return {
		roots: data.roots,
		flatMap,
		pathMap,
		maxDepth: data.maxDepth
	};
}

/**
 * Fetch a single project by ID
 */
export async function fetchProject(id: number): Promise<ProjectWithDetails> {
	const res = await fetch(`/api/projects/${id}`);
	if (!res.ok) throw new Error(`Failed to fetch project: ${res.status}`);
	return res.json();
}

/**
 * Create a new project
 */
export async function createProject(data: NewProject): Promise<Project> {
	const res = await fetch('/api/projects', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	});
	if (!res.ok) throw new Error(`Failed to create project: ${res.status}`);
	return res.json();
}

/**
 * Update an existing project
 */
export async function updateProject(id: number, data: Partial<Project>): Promise<Project> {
	const res = await fetch(`/api/projects/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	});
	if (!res.ok) throw new Error(`Failed to update project: ${res.status}`);
	return res.json();
}

/**
 * Delete a project
 */
export async function deleteProject(id: number): Promise<void> {
	const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
	if (!res.ok) throw new Error(`Failed to delete project: ${res.status}`);
}

/**
 * Fetch all users with access to a project
 */
export async function fetchProjectUsers(projectId: number): Promise<ProjectUser[]> {
	const res = await fetch(`/api/projects/${projectId}/users`);
	if (!res.ok) throw new Error(`Failed to fetch project users: ${res.status}`);
	return res.json();
}

/**
 * Add a user to a project with specific permissions
 */
export async function addProjectUser(
	projectId: number,
	email: string,
	permission: PermissionLevel
): Promise<void> {
	const res = await fetch(`/api/projects/${projectId}/users`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, permission })
	});
	if (!res.ok) throw new Error(`Failed to add user: ${res.status}`);
}

/**
 * Remove a user from a project
 */
export async function removeProjectUser(projectId: number, userId: number): Promise<void> {
	const res = await fetch(`/api/projects/${projectId}/users/${userId}`, {
		method: 'DELETE'
	});
	if (!res.ok) throw new Error(`Failed to remove user: ${res.status}`);
}
