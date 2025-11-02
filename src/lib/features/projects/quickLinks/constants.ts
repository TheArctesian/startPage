/**
 * Quick Links Constants
 *
 * Category definitions, icons, and configuration.
 * Follows UNIX philosophy: single responsibility, no side effects.
 */

import type { LinkCategory } from '$lib/types/database';

export interface CategoryDefinition {
	id: LinkCategory;
	name: string;
	icon: string;
	color: string;
}

export const LINK_CATEGORIES: readonly CategoryDefinition[] = [
	{ id: 'docs', name: 'Documentation', icon: '□', color: 'var(--nord8)' },
	{ id: 'tools', name: 'Tools', icon: '△', color: 'var(--nord9)' },
	{ id: 'resources', name: 'Resources', icon: '○', color: 'var(--nord10)' },
	{ id: 'other', name: 'Other', icon: '◇', color: 'var(--nord4)' }
] as const;

export const ICON_SUGGESTIONS: Record<LinkCategory, readonly string[]> = {
	docs: ['□', '■', '▢', '▣', '▤', '▥'],
	tools: ['△', '▲', '▴', '▵', '▶', '▷'],
	resources: ['○', '●', '◎', '◍', '◌', '◊'],
	other: ['◇', '◈', '◉', '◐', '◑', '◒']
} as const;

/**
 * Get category definition by ID
 */
export function getCategoryById(category: LinkCategory): CategoryDefinition | undefined {
	return LINK_CATEGORIES.find((c) => c.id === category);
}

/**
 * Get category icon for display
 */
export function getCategoryIcon(category: LinkCategory): string {
	return getCategoryById(category)?.icon || '◇';
}

/**
 * Get category color for display
 */
export function getCategoryColor(category: LinkCategory): string {
	return getCategoryById(category)?.color || 'var(--nord4)';
}

/**
 * Get category label for display
 */
export function getCategoryLabel(category: LinkCategory): string {
	return getCategoryById(category)?.name || category;
}

/**
 * Get icon suggestions for a category
 */
export function getIconSuggestions(category: LinkCategory): readonly string[] {
	return ICON_SUGGESTIONS[category] || [];
}
