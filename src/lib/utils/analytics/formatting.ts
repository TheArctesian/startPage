/**
 * Analytics Formatting Utilities
 *
 * Pure functions for formatting analytics data.
 * Extracted from analytics views to avoid duplication.
 */

/**
 * Format minutes as hours and minutes (e.g., "2h 30m", "45m", "3h")
 */
export function formatHours(minutes: number): string {
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;
	if (hours === 0) return `${mins}m`;
	if (mins === 0) return `${hours}h`;
	return `${hours}h ${mins}m`;
}

/**
 * Format average time, rounded for readability
 */
export function formatAverage(minutes: number): string {
	if (minutes < 60) return `${Math.round(minutes)}m`;
	return `${Math.round((minutes / 60) * 10) / 10}h`;
}

/**
 * Format percentage with optional decimal places
 */
export function formatPercentage(value: number, decimals: number = 0): string {
	return `${value.toFixed(decimals)}%`;
}

/**
 * Format large numbers with separators (e.g., 1,234)
 */
export function formatNumber(value: number): string {
	return value.toLocaleString();
}
