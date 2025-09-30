import type { Project, ProjectNode, ProjectTreeData, ProjectWithDetails } from '$lib/types/database';

/**
 * Builds a hierarchical tree structure from a flat array of projects
 */
export function buildProjectTree(projects: ProjectWithDetails[]): ProjectTreeData {
  const flatMap = new Map<number, ProjectNode>();
  const roots: ProjectNode[] = [];
  const pathMap = new Map<string, ProjectNode>();
  
  // First pass: Create all nodes
  for (const project of projects) {
    const node: ProjectNode = {
      ...project,
      children: [],
      hasChildren: false,
      pathArray: [],
      breadcrumb: ''
    };
    flatMap.set(project.id, node);
  }
  
  // Second pass: Build relationships and calculate paths
  for (const project of projects) {
    const node = flatMap.get(project.id)!;
    
    if (project.parentId) {
      const parent = flatMap.get(project.parentId);
      if (parent) {
        parent.children!.push(node);
        parent.hasChildren = true;
        node.parent = parent;
        
        // Build path array and breadcrumb
        node.pathArray = [...parent.pathArray, project.name];
        node.breadcrumb = node.pathArray.join(' > ');
      }
    } else {
      // Root project
      node.pathArray = [project.name];
      node.breadcrumb = project.name;
      roots.push(node);
    }
    
    // Add to path map
    pathMap.set(node.breadcrumb, node);
  }
  
  // Sort children by name within each parent
  function sortChildren(nodes: ProjectNode[]) {
    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        node.children.sort((a, b) => a.name.localeCompare(b.name));
        sortChildren(node.children);
      }
    }
  }
  
  // Sort roots and all children
  roots.sort((a, b) => a.name.localeCompare(b.name));
  sortChildren(roots);
  
  const maxDepth = Math.max(...Array.from(flatMap.values()).map(node => node.depth || 0));
  
  return {
    roots,
    flatMap,
    pathMap,
    maxDepth
  };
}

/**
 * Flattens a tree structure into a depth-first ordered array
 * Respects expanded/collapsed state
 */
export function flattenTree(nodes: ProjectNode[], showOnlyExpanded = true): ProjectNode[] {
  const result: ProjectNode[] = [];
  
  function traverse(nodes: ProjectNode[], currentDepth = 0) {
    for (const node of nodes) {
      result.push(node);
      
      if (node.children && node.children.length > 0) {
        // Only traverse children if parent is expanded (or we're showing all)
        if (!showOnlyExpanded || node.isExpanded) {
          traverse(node.children, currentDepth + 1);
        }
      }
    }
  }
  
  traverse(nodes);
  return result;
}

/**
 * Finds all descendants of a project node
 */
export function getDescendants(node: ProjectNode): ProjectNode[] {
  const descendants: ProjectNode[] = [];
  
  function collect(children: ProjectNode[]) {
    for (const child of children) {
      descendants.push(child);
      if (child.children && child.children.length > 0) {
        collect(child.children);
      }
    }
  }
  
  if (node.children) {
    collect(node.children);
  }
  
  return descendants;
}

/**
 * Finds all ancestors of a project node
 */
export function getAncestors(node: ProjectNode): ProjectNode[] {
  const ancestors: ProjectNode[] = [];
  let current = node.parent;
  
  while (current) {
    ancestors.unshift(current); // Add to beginning for correct order
    current = current.parent;
  }
  
  return ancestors;
}

/**
 * Gets the root project for a given node
 */
export function getRootProject(node: ProjectNode): ProjectNode {
  let current = node;
  while (current.parent) {
    current = current.parent;
  }
  return current;
}

/**
 * Calculates aggregated stats for a project including all descendants
 */
export function calculateAggregatedStats(node: ProjectNode): {
  totalTasks: number;
  completedTasks: number;
  totalMinutes: number;
  descendantCount: number;
} {
  const descendants = getDescendants(node);
  
  let totalTasks = node.totalTasks || 0;
  let completedTasks = node.completedTasks || 0;
  let totalMinutes = node.totalMinutes || 0;
  
  for (const descendant of descendants) {
    totalTasks += descendant.totalTasks || 0;
    completedTasks += descendant.completedTasks || 0;
    totalMinutes += descendant.totalMinutes || 0;
  }
  
  return {
    totalTasks,
    completedTasks,
    totalMinutes,
    descendantCount: descendants.length
  };
}

/**
 * Toggles the expanded state of a project node
 */
export function toggleExpanded(node: ProjectNode): ProjectNode {
  return {
    ...node,
    isExpanded: !node.isExpanded
  };
}

/**
 * Expands all nodes in a tree
 */
export function expandAll(nodes: ProjectNode[]): ProjectNode[] {
  return nodes.map(node => ({
    ...node,
    isExpanded: true,
    children: node.children ? expandAll(node.children) : []
  }));
}

/**
 * Collapses all nodes in a tree
 */
export function collapseAll(nodes: ProjectNode[]): ProjectNode[] {
  return nodes.map(node => ({
    ...node,
    isExpanded: false,
    children: node.children ? collapseAll(node.children) : []
  }));
}

/**
 * Finds a project node by ID in the tree
 */
export function findNodeById(nodes: ProjectNode[], id: number): ProjectNode | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    if (node.children && node.children.length > 0) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Validates if a project can be moved to a new parent (prevents circular references)
 */
export function canMoveProject(
  nodeToMove: ProjectNode, 
  newParent: ProjectNode | null,
  treeData: ProjectTreeData
): { canMove: boolean; reason?: string } {
  // Can't move to itself
  if (newParent && nodeToMove.id === newParent.id) {
    return { canMove: false, reason: 'Cannot move project to itself' };
  }
  
  // Can't move to one of its descendants (would create cycle)
  if (newParent) {
    const descendants = getDescendants(nodeToMove);
    if (descendants.some(desc => desc.id === newParent.id)) {
      return { canMove: false, reason: 'Cannot move project to its descendant' };
    }
  }
  
  return { canMove: true };
}

/**
 * Generates the path string for database storage
 */
export function generatePath(node: ProjectNode): string {
  return node.pathArray.join('/');
}

/**
 * Updates paths for a node and all its descendants after a move
 */
export function updatePathsAfterMove(
  node: ProjectNode, 
  newParent: ProjectNode | null
): ProjectNode {
  const newPathArray = newParent 
    ? [...newParent.pathArray, node.name]
    : [node.name];
  
  const newDepth = newParent ? (newParent.depth || 0) + 1 : 0;
  
  const updatedNode: ProjectNode = {
    ...node,
    parent: newParent,
    parentId: newParent?.id || null,
    pathArray: newPathArray,
    breadcrumb: newPathArray.join(' > '),
    path: newPathArray.join('/'),
    depth: newDepth
  };
  
  // Update all descendants recursively
  if (updatedNode.children) {
    updatedNode.children = updatedNode.children.map(child => 
      updatePathsAfterMove(child, updatedNode)
    );
  }
  
  return updatedNode;
}