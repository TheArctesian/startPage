/**
 * Analytics Calculation Utilities
 *
 * Pure functions for analytics calculations.
 * No DOM, no fetch, no stores - just math.
 * Follows UNIX philosophy: single responsibility, testable, reusable.
 */

import * as d3 from 'd3';
import type { TaskWithDetails, Project } from '$lib/types/database';

export interface AnalyticsData {
	tasks: TaskWithDetails[];
	projects: Project[];
	dateRange: {
		start: Date;
		end: Date;
	};
}

export interface ReportData {
	period: string;
	totalTasks: number;
	completedTasks: number;
	totalTimeSpent: number;
	averageTaskTime: number;
	projectBreakdown: Array<{ project: string; tasks: number; time: number }>;
	intensityBreakdown: Array<{ level: number; count: number; percentage: number }>;
	dailyPattern: Array<{ day: string; tasks: number; time: number }>;
	topProjects: Array<{ name: string; time: number; tasks: number }>;
	productivityTrend: 'up' | 'down' | 'stable';
	insights: string[];
}

export type ReportType = 'daily' | 'weekly' | 'monthly';

/**
 * Calculate date range based on report type and selected date
 */
export function calculateDateRange(
	type: ReportType,
	selectedDate: Date
): { start: Date; end: Date; period: string } {
	let start: Date, end: Date, period: string;

	switch (type) {
		case 'daily':
			start = new Date(selectedDate);
			end = new Date(selectedDate);
			end.setDate(end.getDate() + 1);
			period = d3.timeFormat('%B %d, %Y')(selectedDate);
			break;
		case 'weekly':
			const weekStart = d3.timeWeek.floor(selectedDate);
			start = new Date(weekStart);
			end = new Date(weekStart);
			end.setDate(end.getDate() + 7);
			period = `Week of ${d3.timeFormat('%B %d, %Y')(weekStart)}`;
			break;
		case 'monthly':
			start = d3.timeMonth.floor(selectedDate);
			end = d3.timeMonth.offset(start, 1);
			period = d3.timeFormat('%B %Y')(selectedDate);
			break;
		default:
			start = new Date();
			end = new Date();
			period = 'Unknown';
	}

	return { start, end, period };
}

/**
 * Filter tasks for a specific date range
 */
export function filterTasksByDateRange(
	tasks: TaskWithDetails[],
	start: Date,
	end: Date
): TaskWithDetails[] {
	return tasks.filter((task) => {
		if (!task.completedAt) return false;
		const completedDate = new Date(task.completedAt);
		return completedDate >= start && completedDate < end;
	});
}

/**
 * Calculate project breakdown
 */
export function calculateProjectBreakdown(
	tasks: TaskWithDetails[],
	projects: Project[]
): Array<{ project: string; tasks: number; time: number }> {
	const completedTasks = tasks.filter((t) => t.status === 'done');
	const projectMap = new Map<number, { tasks: number; time: number }>();

	completedTasks.forEach((task) => {
		if (task.projectId) {
			const current = projectMap.get(task.projectId) || { tasks: 0, time: 0 };
			projectMap.set(task.projectId, {
				tasks: current.tasks + 1,
				time: current.time + (task.actualMinutes || 0)
			});
		}
	});

	return Array.from(projectMap.entries())
		.map(([projectId, data]) => {
			const project = projects.find((p) => p.id === projectId);
			return {
				project: project?.name || `Project ${projectId}`,
				tasks: data.tasks,
				time: data.time
			};
		})
		.sort((a, b) => b.time - a.time);
}

/**
 * Calculate intensity distribution
 */
export function calculateIntensityDistribution(
	tasks: TaskWithDetails[]
): Array<{ level: number; count: number; percentage: number }> {
	const completedTasks = tasks.filter((t) => t.status === 'done');
	const intensityMap = new Map<number, number>();

	completedTasks.forEach((task) => {
		if (task.actualIntensity) {
			const current = intensityMap.get(task.actualIntensity) || 0;
			intensityMap.set(task.actualIntensity, current + 1);
		}
	});

	return Array.from(intensityMap.entries())
		.map(([level, count]) => ({
			level,
			count,
			percentage: Math.round((count / Math.max(1, completedTasks.length)) * 100)
		}))
		.sort((a, b) => a.level - b.level);
}

/**
 * Calculate daily pattern (for weekly/monthly reports)
 */
export function calculateDailyPattern(
	tasks: TaskWithDetails[],
	type: ReportType
): Array<{ day: string; tasks: number; time: number }> {
	if (type === 'daily') return [];

	const completedTasks = tasks.filter((t) => t.status === 'done');
	const dailyMap = new Map<string, { tasks: number; time: number }>();

	completedTasks.forEach((task) => {
		if (task.completedAt) {
			const day = d3.timeFormat('%a')(new Date(task.completedAt));
			const current = dailyMap.get(day) || { tasks: 0, time: 0 };
			dailyMap.set(day, {
				tasks: current.tasks + 1,
				time: current.time + (task.actualMinutes || 0)
			});
		}
	});

	const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
	return weekDays.map((day) => {
		const data = dailyMap.get(day) || { tasks: 0, time: 0 };
		return { day, ...data };
	});
}

/**
 * Calculate productivity trend
 */
export function calculateProductivityTrend(
	currentTasks: TaskWithDetails[],
	previousTasks: TaskWithDetails[]
): 'up' | 'down' | 'stable' {
	const currentCompleted = currentTasks.filter((t) => t.status === 'done');
	const previousCompleted = previousTasks.filter((t) => t.status === 'done');

	const currentTime = currentCompleted.reduce((sum, t) => sum + (t.actualMinutes || 0), 0);
	const previousTime = previousCompleted.reduce((sum, t) => sum + (t.actualMinutes || 0), 0);

	const currentScore = currentCompleted.length + currentTime / 60;
	const previousScore = previousCompleted.length + previousTime / 60;

	if (currentScore > previousScore * 1.1) return 'up';
	if (currentScore < previousScore * 0.9) return 'down';
	return 'stable';
}

/**
 * Generate insights based on task data
 */
export function generateInsights(
	tasks: TaskWithDetails[],
	totalTasks: number,
	projectBreakdown: Array<{ project: string; tasks: number; time: number }>,
	productivityTrend: 'up' | 'down' | 'stable'
): string[] {
	const completedTasks = tasks.filter((t) => t.status === 'done');
	const insights: string[] = [];

	if (completedTasks.length === 0) {
		insights.push('No tasks completed in this period. Consider setting smaller, achievable goals.');
		return insights;
	}

	if (completedTasks.length >= 5) {
		insights.push(`Great productivity! You completed ${completedTasks.length} tasks.`);
	}

	const totalTimeSpent = completedTasks.reduce((sum, t) => sum + (t.actualMinutes || 0), 0);
	if (totalTimeSpent > 0) {
		const avgTime = totalTimeSpent / completedTasks.length;
		if (avgTime > 120) {
			insights.push(
				'Your tasks took longer than average. Consider breaking them down into smaller chunks.'
			);
		} else if (avgTime < 30) {
			insights.push(
				"You're completing tasks quickly! This could indicate good efficiency or tasks that are too small."
			);
		}
	}

	const highIntensityTasks = completedTasks.filter((t) => (t.actualIntensity || 0) >= 4).length;
	const totalWithIntensity = completedTasks.filter((t) => t.actualIntensity).length;

	if (totalWithIntensity > 0) {
		const highIntensityPercentage = (highIntensityTasks / totalWithIntensity) * 100;
		if (highIntensityPercentage > 50) {
			insights.push('High intensity focus! Make sure to balance with easier tasks to avoid burnout.');
		} else if (highIntensityPercentage < 20) {
			insights.push('Mostly low-intensity tasks. Consider tackling some challenging work for growth.');
		}
	}

	if (productivityTrend === 'up') {
		insights.push('Productivity is trending upward! Keep up the momentum.');
	} else if (productivityTrend === 'down') {
		insights.push(
			'Productivity has decreased. Consider what might be causing this and how to address it.'
		);
	}

	if (projectBreakdown.length > 3) {
		insights.push(
			"You're working on multiple projects. Make sure you're maintaining focus and not spreading too thin."
		);
	}

	if (insights.length === 0) {
		insights.push('Keep tracking your tasks to generate more personalized insights!');
	}

	return insights;
}

/**
 * Calculate average estimation accuracy
 */
export function calculateAverageAccuracy(tasks: TaskWithDetails[]): {
	time: number;
	intensity: number;
} {
	const timeAccuracies = tasks
		.filter((t) => t.estimatedMinutes > 0 && (t.actualMinutes || 0) > 0)
		.map((t) => {
			const timeDiff = Math.abs((t.actualMinutes || 0) - t.estimatedMinutes);
			return Math.max(0, (1 - timeDiff / t.estimatedMinutes) * 100);
		});

	const intensityAccuracies = tasks
		.filter((t) => t.estimatedIntensity > 0 && (t.actualIntensity || 0) > 0)
		.map((t) => {
			const intensityDiff = Math.abs((t.actualIntensity || 0) - t.estimatedIntensity);
			return Math.max(0, (1 - intensityDiff / 4) * 100);
		});

	return {
		time:
			timeAccuracies.length > 0
				? timeAccuracies.reduce((sum, acc) => sum + acc, 0) / timeAccuracies.length
				: 0,
		intensity:
			intensityAccuracies.length > 0
				? intensityAccuracies.reduce((sum, acc) => sum + acc, 0) / intensityAccuracies.length
				: 0
	};
}

/**
 * Calculate task completion consistency
 */
export function calculateConsistency(tasks: TaskWithDetails[]): number {
	if (tasks.length < 7) return 0.5; // Default for insufficient data

	const dailyCompletions = new Map<string, number>();
	tasks.forEach((task) => {
		if (task.completedAt) {
			const day = new Date(task.completedAt).toDateString();
			dailyCompletions.set(day, (dailyCompletions.get(day) || 0) + 1);
		}
	});

	const completionCounts = Array.from(dailyCompletions.values());
	const avgDaily =
		completionCounts.reduce((sum, count) => sum + count, 0) / completionCounts.length;
	const variance =
		completionCounts.reduce((sum, count) => sum + Math.pow(count - avgDaily, 2), 0) /
		completionCounts.length;
	const stdDev = Math.sqrt(variance);

	// Higher consistency = lower relative standard deviation
	return Math.max(0, 1 - stdDev / Math.max(1, avgDaily));
}

/**
 * Calculate productivity score (0-100)
 */
export function calculateProductivityScore(
	tasks: TaskWithDetails[],
	allTasks: TaskWithDetails[]
): number {
	if (tasks.length === 0) return 0;

	const accuracy = calculateAverageAccuracy(tasks);
	const factors = {
		completion: tasks.length / Math.max(1, allTasks.length),
		timeAccuracy: accuracy.time / 100,
		intensityAccuracy: accuracy.intensity / 100,
		consistency: calculateConsistency(tasks)
	};

	return Math.round(
		(factors.completion * 0.3 +
			factors.timeAccuracy * 0.3 +
			factors.intensityAccuracy * 0.2 +
			factors.consistency * 0.2) *
			100
	);
}

/**
 * Generate full report data
 */
export function generateReport(
	tasks: TaskWithDetails[],
	projects: Project[],
	type: ReportType,
	selectedDate: Date
): ReportData {
	const { start, end, period } = calculateDateRange(type, selectedDate);
	const periodTasks = filterTasksByDateRange(tasks, start, end);
	const completedTasks = periodTasks.filter((t) => t.status === 'done');
	const totalTimeSpent = completedTasks.reduce((sum, t) => sum + (t.actualMinutes || 0), 0);

	// Calculate previous period for trend
	const previousStart = new Date(start);
	const previousEnd = new Date(end);
	if (type === 'daily') {
		previousStart.setDate(previousStart.getDate() - 1);
		previousEnd.setDate(previousEnd.getDate() - 1);
	} else if (type === 'weekly') {
		previousStart.setDate(previousStart.getDate() - 7);
		previousEnd.setDate(previousEnd.getDate() - 7);
	} else {
		previousStart.setMonth(previousStart.getMonth() - 1);
		previousEnd.setMonth(previousEnd.getMonth() - 1);
	}
	const previousTasks = filterTasksByDateRange(tasks, previousStart, previousEnd);

	const projectBreakdown = calculateProjectBreakdown(periodTasks, projects);
	const intensityBreakdown = calculateIntensityDistribution(periodTasks);
	const dailyPattern = calculateDailyPattern(periodTasks, type);
	const productivityTrend = calculateProductivityTrend(periodTasks, previousTasks);

	const topProjects = projectBreakdown.slice(0, 5).map((p) => ({
		name: p.project,
		time: Math.round((p.time / 60) * 10) / 10, // Convert to hours
		tasks: p.tasks
	}));

	const insights = generateInsights(
		periodTasks,
		periodTasks.length,
		projectBreakdown,
		productivityTrend
	);

	return {
		period,
		totalTasks: periodTasks.length,
		completedTasks: completedTasks.length,
		totalTimeSpent,
		averageTaskTime: completedTasks.length > 0 ? totalTimeSpent / completedTasks.length : 0,
		projectBreakdown,
		intensityBreakdown,
		dailyPattern,
		topProjects,
		productivityTrend,
		insights
	};
}
