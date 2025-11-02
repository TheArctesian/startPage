/**
 * Analytics API response types
 */
export interface DailyAnalyticsData {
	startDate: string;
	endDate: string;
	days: Array<{
		date: string;
		minutes: number;
		tasksCompleted: number;
	}>;
}

export interface DailyAnalyticsParams {
	/** Number of days to include (default: 7) */
	days?: number;
	/** Optional project ID to filter by */
	projectId?: number;
	/** Explicit start date (ISO format) */
	startDate?: string;
	/** Explicit end date (ISO format) */
	endDate?: string;
}

/**
 * Fetch daily analytics data
 * @param params - Query parameters for filtering analytics
 */
export async function fetchDailyAnalytics(
	params?: DailyAnalyticsParams
): Promise<DailyAnalyticsData> {
	const searchParams = new URLSearchParams();

	if (params?.days) searchParams.set('days', params.days.toString());
	if (params?.projectId) searchParams.set('project', params.projectId.toString());
	if (params?.startDate) searchParams.set('start', params.startDate);
	if (params?.endDate) searchParams.set('end', params.endDate);

	const url = `/api/analytics/daily${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Failed to fetch daily analytics: ${res.status}`);
	return res.json();
}
