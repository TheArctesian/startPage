/**
 * QuickLink Service
 *
 * Business logic layer for quick link operations.
 * Orchestrates repositories and validators following SOLID principles.
 *
 * Following SRP: Only handles quick link business logic
 * Following DIP: Depends on repository and validator abstractions
 */

import type { IQuickLinkRepository } from '../repositories/interfaces/quicklink.repository';
import {
	createQuickLinkValidator,
	updateQuickLinkValidator,
	ValidationException
} from '../validation';
import type { QuickLink, NewQuickLink, LinkCategory } from '$lib/types/database';
import type { UpdateQuickLinkDTO } from '../repositories/interfaces/quicklink.repository';

export class QuickLinkService {
	constructor(private quickLinkRepository: IQuickLinkRepository) {}

	/**
	 * Create a new quick link with validation
	 */
	async createQuickLink(data: NewQuickLink): Promise<QuickLink> {
		// Validate input
		createQuickLinkValidator.validateOrThrow(data);

		// Business rule: Validate URL is accessible (optional - could be async check)
		// For now, we rely on the URL validation in the validator

		// Create quick link
		return this.quickLinkRepository.create(data);
	}

	/**
	 * Update an existing quick link
	 */
	async updateQuickLink(id: number, data: UpdateQuickLinkDTO): Promise<QuickLink> {
		// Validate input
		updateQuickLinkValidator.validateOrThrow(data);

		// Check if quick link exists
		const existing = await this.quickLinkRepository.findById(id);
		if (!existing) {
			throw new Error(`QuickLink with ID ${id} not found`);
		}

		// Update quick link
		return this.quickLinkRepository.update(id, data);
	}

	/**
	 * Delete a quick link
	 */
	async deleteQuickLink(id: number): Promise<boolean> {
		const exists = await this.quickLinkRepository.exists(id);
		if (!exists) {
			throw new Error(`QuickLink with ID ${id} not found`);
		}

		return this.quickLinkRepository.delete(id);
	}

	/**
	 * Get quick link by ID
	 */
	async getQuickLinkById(id: number): Promise<QuickLink | null> {
		return this.quickLinkRepository.findById(id);
	}

	/**
	 * Get all quick links for a project
	 */
	async getQuickLinksByProject(projectId: number): Promise<QuickLink[]> {
		return this.quickLinkRepository.findByProject(projectId);
	}

	/**
	 * Get quick links by category
	 */
	async getQuickLinksByCategory(
		category: LinkCategory,
		projectId?: number
	): Promise<QuickLink[]> {
		return this.quickLinkRepository.findByCategory(category, projectId);
	}

	/**
	 * Get quick links grouped by category
	 */
	async getQuickLinksGroupedByCategory(projectId: number): Promise<
		Record<LinkCategory, QuickLink[]>
	> {
		return this.quickLinkRepository.findGroupedByCategory(projectId);
	}

	/**
	 * Search quick links
	 */
	async searchQuickLinks(searchQuery: string, projectId?: number): Promise<QuickLink[]> {
		return this.quickLinkRepository.findAll({
			search: searchQuery,
			projectId
		});
	}

	/**
	 * Reorder quick links within a category
	 */
	async reorderQuickLinks(linkIds: number[], category: LinkCategory): Promise<boolean> {
		// Validate all links exist and belong to same category
		const links = await Promise.all(
			linkIds.map((id) => this.quickLinkRepository.findById(id))
		);

		const invalidLinks = links.filter((link) => !link || link.category !== category);
		if (invalidLinks.length > 0) {
			throw new Error('All links must exist and belong to the same category');
		}

		return this.quickLinkRepository.reorder(linkIds, category);
	}

	/**
	 * Batch create quick links
	 */
	async batchCreateQuickLinks(linksData: NewQuickLink[]): Promise<QuickLink[]> {
		const createdLinks: QuickLink[] = [];

		for (const data of linksData) {
			try {
				const link = await this.createQuickLink(data);
				createdLinks.push(link);
			} catch (error) {
				console.error('Failed to create quick link:', error);
				// Continue with other links
			}
		}

		return createdLinks;
	}

	/**
	 * Batch update quick links
	 */
	async batchUpdateQuickLinks(
		updates: Array<{ id: number; data: UpdateQuickLinkDTO }>
	): Promise<QuickLink[]> {
		const updatedLinks: QuickLink[] = [];

		for (const { id, data } of updates) {
			try {
				const updated = await this.updateQuickLink(id, data);
				updatedLinks.push(updated);
			} catch (error) {
				console.error(`Failed to update quick link ${id}:`, error);
				// Continue with other updates
			}
		}

		return updatedLinks;
	}

	/**
	 * Batch delete quick links
	 */
	async batchDeleteQuickLinks(ids: number[]): Promise<number> {
		let deletedCount = 0;

		for (const id of ids) {
			try {
				const success = await this.deleteQuickLink(id);
				if (success) deletedCount++;
			} catch (error) {
				console.error(`Failed to delete quick link ${id}:`, error);
				// Continue with other deletions
			}
		}

		return deletedCount;
	}

	/**
	 * Move quick link to different category
	 */
	async moveQuickLinkToCategory(id: number, newCategory: LinkCategory): Promise<QuickLink> {
		const existing = await this.quickLinkRepository.findById(id);
		if (!existing) {
			throw new Error(`QuickLink with ID ${id} not found`);
		}

		if (existing.category === newCategory) {
			return existing; // Already in that category
		}

		return this.updateQuickLink(id, { category: newCategory });
	}

	/**
	 * Get quick link count by category
	 */
	async getQuickLinkCountByCategory(
		projectId?: number
	): Promise<Record<LinkCategory, number>> {
		const grouped = projectId
			? await this.quickLinkRepository.findGroupedByCategory(projectId)
			: {
					docs: await this.quickLinkRepository.findByCategory('docs'),
					tools: await this.quickLinkRepository.findByCategory('tools'),
					resources: await this.quickLinkRepository.findByCategory('resources'),
					other: await this.quickLinkRepository.findByCategory('other')
				};

		return {
			docs: grouped.docs.length,
			tools: grouped.tools.length,
			resources: grouped.resources.length,
			other: grouped.other.length
		};
	}

	/**
	 * Get quick link statistics for a project
	 */
	async getProjectQuickLinkStats(projectId: number) {
		const links = await this.quickLinkRepository.findByProject(projectId);
		const categoryCounts = await this.getQuickLinkCountByCategory(projectId);

		return {
			total: links.length,
			byCategory: categoryCounts,
			mostPopularCategory: Object.entries(categoryCounts).reduce(
				(max, [cat, count]) => (count > max.count ? { category: cat as LinkCategory, count } : max),
				{ category: 'docs' as LinkCategory, count: 0 }
			).category
		};
	}

	/**
	 * Duplicate a quick link
	 */
	async duplicateQuickLink(id: number, newTitle?: string): Promise<QuickLink> {
		const existing = await this.quickLinkRepository.findById(id);
		if (!existing) {
			throw new Error(`QuickLink with ID ${id} not found`);
		}

		const duplicateData: NewQuickLink = {
			title: newTitle || `${existing.title} (Copy)`,
			url: existing.url,
			category: existing.category,
			projectId: existing.projectId,
			description: existing.description,
			icon: existing.icon,
			displayOrder: existing.displayOrder
		};

		return this.createQuickLink(duplicateData);
	}

	/**
	 * Copy quick links from one project to another
	 */
	async copyQuickLinksToProject(
		sourceProjectId: number,
		targetProjectId: number,
		categories?: LinkCategory[]
	): Promise<QuickLink[]> {
		const sourceLinks = await this.quickLinkRepository.findByProject(sourceProjectId);

		const linksToCopy = categories
			? sourceLinks.filter((link) => categories.includes(link.category))
			: sourceLinks;

		const copiedLinks: QuickLink[] = [];

		for (const link of linksToCopy) {
			try {
				const newLink = await this.createQuickLink({
					title: link.title,
					url: link.url,
					category: link.category,
					projectId: targetProjectId,
					description: link.description,
					icon: link.icon,
					displayOrder: link.displayOrder
				});
				copiedLinks.push(newLink);
			} catch (error) {
				console.error(`Failed to copy quick link ${link.id}:`, error);
				// Continue with other links
			}
		}

		return copiedLinks;
	}

	/**
	 * Get all quick links with pagination
	 */
	async getAllQuickLinks(page = 1, pageSize = 50) {
		const offset = (page - 1) * pageSize;
		const [items, total] = await Promise.all([
			this.quickLinkRepository.findAll({ limit: pageSize, offset }),
			this.quickLinkRepository.count()
		]);

		return {
			items,
			total,
			page,
			pageSize,
			totalPages: Math.ceil(total / pageSize)
		};
	}

	/**
	 * Validate URL is accessible (async business rule)
	 */
	async validateUrlAccessible(url: string): Promise<boolean> {
		try {
			// This is a placeholder - in production you might want to:
			// 1. Make a HEAD request to check if URL is accessible
			// 2. Check against a blacklist of domains
			// 3. Validate SSL certificates
			// For now, we just validate the URL format
			new URL(url);
			return true;
		} catch {
			return false;
		}
	}
}
