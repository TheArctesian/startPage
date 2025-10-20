/**
 * QuickLink Validation Rules
 *
 * Composable validation rules for quick link entities.
 */

import {
  Validator,
  RequiredRule,
  StringLengthRule,
  EnumRule,
  UrlRule,
  type ValidationResult
} from './base-validator';
import type { NewQuickLink, LinkCategory } from '$lib/types/database';

const LINK_CATEGORIES: readonly LinkCategory[] = ['docs', 'tools', 'resources', 'other'] as const;

/**
 * Validator for creating new quick links
 */
export class CreateQuickLinkValidator {
  private validator: Validator<NewQuickLink>;

  constructor() {
    this.validator = Validator.create<NewQuickLink>()
      .add(new RequiredRule('title'))
      .add(new StringLengthRule('title', 1, 255,
        'Link title must be between 1 and 255 characters'))
      .add(new RequiredRule('url'))
      .add(new UrlRule('url'))
      .add(new StringLengthRule('url', undefined, 2000))
      .add(new RequiredRule('projectId'))
      .add(new EnumRule('category', LINK_CATEGORIES));
  }

  validate(data: NewQuickLink): ValidationResult {
    return this.validator.validate(data);
  }

  validateOrThrow(data: NewQuickLink): void {
    this.validator.validateOrThrow(data);
  }
}

/**
 * Validator for updating quick links
 */
export class UpdateQuickLinkValidator {
  private validator: Validator;

  constructor() {
    this.validator = Validator.create()
      .add(new StringLengthRule('title', 1, 255))
      .add(new UrlRule('url'))
      .add(new StringLengthRule('url', undefined, 2000))
      .add(new EnumRule('category', LINK_CATEGORIES));
  }

  validate(data: Partial<NewQuickLink>): ValidationResult {
    return this.validator.validate(data);
  }

  validateOrThrow(data: Partial<NewQuickLink>): void {
    this.validator.validateOrThrow(data);
  }
}

// Export singleton instances
export const createQuickLinkValidator = new CreateQuickLinkValidator();
export const updateQuickLinkValidator = new UpdateQuickLinkValidator();
