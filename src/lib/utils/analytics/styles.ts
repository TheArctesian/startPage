/**
 * Analytics Style Utilities
 *
 * Pure functions for returning colors, icons, and labels.
 * Follows UNIX philosophy: single responsibility, no side effects.
 */

export type TrendType = 'up' | 'down' | 'stable';
export type InsightType = 'success' | 'warning' | 'info' | 'error';

/**
 * Get icon for productivity trend
 */
export function getTrendIcon(trend: TrendType): string {
	switch (trend) {
		case 'up':
			return '▲';
		case 'down':
			return '▼';
		default:
			return '■';
	}
}

/**
 * Get color for productivity trend
 */
export function getTrendColor(trend: TrendType): string {
	switch (trend) {
		case 'up':
			return 'var(--color-success)';
		case 'down':
			return 'var(--color-error)';
		default:
			return 'var(--text-secondary)';
	}
}

/**
 * Get color for intensity level (1-5)
 */
export function getIntensityColor(level: number): string {
	const colors = [
		'var(--intensity-1)',
		'var(--intensity-2)',
		'var(--intensity-3)',
		'var(--intensity-4)',
		'var(--intensity-5)'
	];
	return colors[level - 1] || 'var(--text-secondary)';
}

/**
 * Get color for productivity score (0-100)
 */
export function getScoreColor(score: number): string {
	if (score >= 80) return 'var(--color-success)';
	if (score >= 60) return 'var(--color-info)';
	if (score >= 40) return 'var(--color-warning)';
	return 'var(--color-error)';
}

/**
 * Get label for productivity score (0-100)
 */
export function getScoreLabel(score: number): string {
	if (score >= 80) return 'Excellent';
	if (score >= 60) return 'Good';
	if (score >= 40) return 'Fair';
	return 'Needs Improvement';
}

/**
 * Get CSS class for insight type
 */
export function getInsightClass(type: InsightType): string {
	return type;
}
