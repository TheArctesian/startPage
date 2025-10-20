/**
 * Task Validation Rules
 *
 * Composable validation rules for task entities.
 * Follows Open/Closed Principle - new rules can be added without modification.
 */

import {
  Validator,
  RequiredRule,
  StringLengthRule,
  NumberRangeRule,
  EnumRule,
  CustomRule,
  type ValidationResult
} from './base-validator';
import type { NewTask, TaskStatus, Priority } from '$lib/types/database';

// Valid enum values
const TASK_STATUSES: readonly TaskStatus[] = ['todo', 'in_progress', 'done', 'archived'] as const;
const PRIORITIES: readonly Priority[] = ['low', 'medium', 'high'] as const;

/**
 * Validator for creating new tasks
 */
export class CreateTaskValidator {
  private validator: Validator<NewTask>;

  constructor() {
    this.validator = Validator.create<NewTask>()
      .add(new RequiredRule('title'))
      .add(new StringLengthRule('title', 1, 500))
      .add(new StringLengthRule('description', undefined, 5000))
      .add(new RequiredRule('projectId'))
      .add(new RequiredRule('estimatedMinutes'))
      .add(new NumberRangeRule('estimatedMinutes', 1, 1440,
        'Estimated minutes must be between 1 and 1440 (24 hours)'))
      .add(new RequiredRule('estimatedIntensity'))
      .add(new NumberRangeRule('estimatedIntensity', 1, 5,
        'Estimated intensity must be between 1 and 5'))
      .add(new EnumRule('status', TASK_STATUSES))
      .add(new EnumRule('priority', PRIORITIES))
      .add(new CustomRule(
        'dueDate',
        (value: string | null) => {
          if (!value) return true; // Optional field
          const date = new Date(value);
          return !isNaN(date.getTime());
        },
        'Due date must be a valid date',
        'INVALID_DATE'
      ));
  }

  /**
   * Validate task creation data
   */
  validate(data: NewTask): ValidationResult {
    return this.validator.validate(data);
  }

  /**
   * Validate and throw on error
   */
  validateOrThrow(data: NewTask): void {
    this.validator.validateOrThrow(data);
  }
}

/**
 * Validator for updating tasks
 */
export class UpdateTaskValidator {
  private validator: Validator;

  constructor() {
    this.validator = Validator.create()
      // All fields optional for updates, but validate if provided
      .add(new StringLengthRule('title', 1, 500))
      .add(new StringLengthRule('description', undefined, 5000))
      .add(new NumberRangeRule('estimatedMinutes', 1, 1440))
      .add(new NumberRangeRule('estimatedIntensity', 1, 5))
      .add(new NumberRangeRule('actualMinutes', 0, 1440))
      .add(new NumberRangeRule('actualIntensity', 1, 5))
      .add(new EnumRule('status', TASK_STATUSES))
      .add(new EnumRule('priority', PRIORITIES))
      .add(new CustomRule(
        'dueDate',
        (value: string | null | undefined) => {
          if (!value) return true;
          const date = new Date(value);
          return !isNaN(date.getTime());
        },
        'Due date must be a valid date',
        'INVALID_DATE'
      ));
  }

  validate(data: Partial<NewTask>): ValidationResult {
    return this.validator.validate(data);
  }

  validateOrThrow(data: Partial<NewTask>): void {
    this.validator.validateOrThrow(data);
  }
}

/**
 * Validator for task completion
 */
export class CompleteTaskValidator {
  private validator: Validator;

  constructor() {
    this.validator = Validator.create()
      .add(new RequiredRule('actualIntensity'))
      .add(new NumberRangeRule('actualIntensity', 1, 5,
        'Actual intensity must be between 1 and 5'))
      .add(new NumberRangeRule('actualMinutes', 0, 1440,
        'Actual minutes must be between 0 and 1440 (24 hours)'));
  }

  validate(data: { actualIntensity: number; actualMinutes?: number }): ValidationResult {
    return this.validator.validate(data);
  }

  validateOrThrow(data: { actualIntensity: number; actualMinutes?: number }): void {
    this.validator.validateOrThrow(data);
  }
}

/**
 * Business rule validators
 */
export class TaskBusinessRules {
  /**
   * Validate task can be moved to status
   */
  static canTransitionTo(currentStatus: TaskStatus, newStatus: TaskStatus): ValidationResult {
    const invalidTransitions: Record<TaskStatus, TaskStatus[]> = {
      'todo': [],
      'in_progress': [],
      'done': ['todo'], // Can't go back to todo
      'archived': ['todo', 'in_progress'] // Archived can only go to done or stay archived
    };

    const disallowed = invalidTransitions[currentStatus] || [];
    const valid = !disallowed.includes(newStatus);

    return {
      valid,
      errors: valid ? [] : [{
        field: 'status',
        message: `Cannot transition from ${currentStatus} to ${newStatus}`,
        code: 'INVALID_STATUS_TRANSITION'
      }]
    };
  }

  /**
   * Validate task is not overdue before completing
   */
  static validateDueDate(dueDate: string | null): ValidationResult {
    if (!dueDate) return { valid: true, errors: [] };

    const due = new Date(dueDate);
    const now = new Date();

    // This is a warning, not a hard error
    const overdue = due < now;

    return {
      valid: true, // Don't block completion
      errors: overdue ? [{
        field: 'dueDate',
        message: 'Task is overdue',
        code: 'TASK_OVERDUE'
      }] : []
    };
  }

  /**
   * Validate estimated time is reasonable
   */
  static validateEstimateReasonable(estimatedMinutes: number, estimatedIntensity: number): ValidationResult {
    // High intensity should generally mean less time (focused work)
    // Low intensity might mean more time (learning, research)
    // This is a soft validation for warnings

    const isUnusual = (estimatedIntensity >= 4 && estimatedMinutes > 240) ||
                      (estimatedIntensity <= 2 && estimatedMinutes < 15);

    return {
      valid: true, // Don't block, just warn
      errors: isUnusual ? [{
        field: 'estimatedMinutes',
        message: 'Time estimate seems unusual for this intensity level',
        code: 'UNUSUAL_ESTIMATE'
      }] : []
    };
  }
}

// Export singleton instances for convenience
export const createTaskValidator = new CreateTaskValidator();
export const updateTaskValidator = new UpdateTaskValidator();
export const completeTaskValidator = new CompleteTaskValidator();
