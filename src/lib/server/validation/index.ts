/**
 * Validation Framework
 *
 * Central export point for validation layer following SOLID principles.
 *
 * Usage:
 * ```typescript
 * import { createTaskValidator } from '$lib/server/validation';
 *
 * const result = createTaskValidator.validate(taskData);
 * if (!result.valid) {
 *   return json({ errors: result.errors }, { status: 400 });
 * }
 * ```
 */

// Export base validation framework
export * from './base-validator';

// Export entity validators
export * from './task.validator';
export * from './project.validator';
export * from './quicklink.validator';
