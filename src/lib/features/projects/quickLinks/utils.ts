/**
 * Quick Links Utilities
 *
 * URL validation and formatting functions.
 * Follows UNIX philosophy: pure functions, no side effects.
 */

/**
 * Extract domain from URL for display
 */
export function getDomainFromUrl(url: string): string {
	try {
		const domain = new URL(url).hostname;
		return domain.replace('www.', '');
	} catch {
		return url;
	}
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
	if (!url) return false;
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
}

/**
 * Auto-add protocol if missing
 */
export function normalizeUrl(url: string): string {
	if (!url) return '';
	if (!/^https?:\/\//i.test(url)) {
		return `https://${url}`;
	}
	return url;
}
