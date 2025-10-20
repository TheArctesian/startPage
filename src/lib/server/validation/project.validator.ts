/**
 * Project Validation Rules
 *
 * Composable validation rules for project entities.
 */

import {
  Validator,
  RequiredRule,
  StringLengthRule,
  EnumRule,
  CustomRule,
  type ValidationResult
} from './base-validator';
import type { NewProject, ProjectStatus } from '$lib/types/database';

const PROJECT_STATUSES: readonly ProjectStatus[] = ['active', 'done', 'archived'] as const;

/**
 * Validator for creating new projects
 */
export class CreateProjectValidator {
  private validator: Validator<NewProject>;

  constructor() {
    this.validator = Validator.create<NewProject>()
      .add(new RequiredRule('name'))
      .add(new StringLengthRule('name', 1, 255,
        'Project name must be between 1 and 255 characters'))
      .add(new StringLengthRule('description', undefined, 2000))
      .add(new CustomRule(
        'color',
        (value: string) => {
          if (!value) return true;
          // Validate CSS color variable or hex color
          return /^(--[\w-]+|#[0-9A-Fa-f]{6})$/.test(value);
        },
        'Color must be a valid CSS variable (--nord8) or hex color (#88c0d0)',
        'INVALID_COLOR'
      ))
      .add(new CustomRule(
        'icon',
        (value: string | null) => {
          if (!value) return true;
          // Validate emoji or single character
          return value.length >= 1 && value.length <= 10;
        },
        'Icon must be an emoji or short string',
        'INVALID_ICON'
      ))
      .add(new EnumRule('status', PROJECT_STATUSES));
  }

  validate(data: NewProject): ValidationResult {
    return this.validator.validate(data);
  }

  validateOrThrow(data: NewProject): void {
    this.validator.validateOrThrow(data);
  }
}

/**
 * Validator for updating projects
 */
export class UpdateProjectValidator {
  private validator: Validator;

  constructor() {
    this.validator = Validator.create()
      .add(new StringLengthRule('name', 1, 255))
      .add(new StringLengthRule('description', undefined, 2000))
      .add(new CustomRule(
        'color',
        (value: string | undefined) => {
          if (!value) return true;
          return /^(--[\w-]+|#[0-9A-Fa-f]{6})$/.test(value);
        },
        'Color must be a valid CSS variable or hex color',
        'INVALID_COLOR'
      ))
      .add(new EnumRule('status', PROJECT_STATUSES));
  }

  validate(data: Partial<NewProject>): ValidationResult {
    return this.validator.validate(data);
  }

  validateOrThrow(data: Partial<NewProject>): void {
    this.validator.validateOrThrow(data);
  }
}

/**
 * Project business rules
 */
export class ProjectBusinessRules {
  /**
   * Validate project name is unique within parent
   * Note: This requires database access, so it's async
   */
  static async validateUniqueNameInParent(
    name: string,
    parentId: number | null,
    checkExists: (name: string, parentId: number | null) => Promise<boolean>
  ): Promise<ValidationResult> {
    const exists = await checkExists(name, parentId);

    return {
      valid: !exists,
      errors: exists ? [{
        field: 'name',
        message: 'A project with this name already exists in this location',
        code: 'DUPLICATE_PROJECT_NAME'
      }] : []
    };
  }

  /**
   * Validate project can be moved to new parent (prevent circular references)
   */
  static validateMoveDestination(
    projectId: number,
    newParentId: number | null,
    getAncestors: (id: number) => number[]
  ): ValidationResult {
    if (!newParentId) {
      return { valid: true, errors: [] }; // Moving to root is always valid
    }

    // Can't move to self
    if (projectId === newParentId) {
      return {
        valid: false,
        errors: [{
          field: 'parentId',
          message: 'Cannot move project to itself',
          code: 'CIRCULAR_REFERENCE'
        }]
      };
    }

    // Can't move to own descendant (would create circular reference)
    const ancestors = getAncestors(newParentId);
    if (ancestors.includes(projectId)) {
      return {
        valid: false,
        errors: [{
          field: 'parentId',
          message: 'Cannot move project to its own descendant',
          code: 'CIRCULAR_REFERENCE'
        }]
      };
    }

    return { valid: true, errors: [] };
  }

  /**
   * Validate project depth doesn't exceed maximum
   */
  static validateMaxDepth(depth: number, maxDepth = 10): ValidationResult {
    const valid = depth <= maxDepth;

    return {
      valid,
      errors: valid ? [] : [{
        field: 'parentId',
        message: `Project hierarchy cannot exceed ${maxDepth} levels`,
        code: 'MAX_DEPTH_EXCEEDED',
        context: { depth, maxDepth }
      }]
    };
  }

  /**
   * Validate project can be archived
   */
  static canArchive(hasActiveSubprojects: boolean, hasActiveTasks: boolean): ValidationResult {
    if (!hasActiveSubprojects && !hasActiveTasks) {
      return { valid: true, errors: [] };
    }

    const errors = [];

    if (hasActiveSubprojects) {
      errors.push({
        field: 'status',
        message: 'Cannot archive project with active sub-projects',
        code: 'HAS_ACTIVE_SUBPROJECTS'
      });
    }

    if (hasActiveTasks) {
      errors.push({
        field: 'status',
        message: 'Cannot archive project with active tasks',
        code: 'HAS_ACTIVE_TASKS'
      });
    }

    return {
      valid: false,
      errors
    };
  }
}

// Export singleton instances
export const createProjectValidator = new CreateProjectValidator();
export const updateProjectValidator = new UpdateProjectValidator();
