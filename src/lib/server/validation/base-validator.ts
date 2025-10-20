/**
 * Base Validation Framework
 *
 * Provides extensible validation following the Open/Closed Principle.
 * New validation rules can be added without modifying existing code.
 *
 * Benefits:
 * - Composable validation rules
 * - Reusable validation logic
 * - Type-safe validation
 * - Clear error messages
 */

/**
 * Result of a validation check
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Validation errors (empty if valid) */
  errors: ValidationError[];
}

/**
 * Individual validation error
 */
export interface ValidationError {
  /** Field that failed validation */
  field: string;
  /** Error message */
  message: string;
  /** Error code for programmatic handling */
  code: string;
  /** Additional context */
  context?: Record<string, any>;
}

/**
 * Abstract base class for validation rules
 * Follows Template Method pattern
 */
export abstract class ValidationRule<T = any> {
  constructor(
    protected field: string,
    protected message?: string
  ) {}

  /**
   * Validate a value
   * @param value - Value to validate
   * @param context - Full object being validated (for cross-field validation)
   * @returns Validation result
   */
  validate(value: T, context?: any): ValidationResult {
    const isValid = this.check(value, context);

    if (isValid) {
      return { valid: true, errors: [] };
    }

    return {
      valid: false,
      errors: [{
        field: this.field,
        message: this.message || this.getDefaultMessage(),
        code: this.getErrorCode(),
        context: this.getErrorContext(value, context)
      }]
    };
  }

  /**
   * Perform the actual validation check
   * @protected - Implement in subclasses
   */
  protected abstract check(value: T, context?: any): boolean;

  /**
   * Get default error message
   * @protected - Override in subclasses
   */
  protected abstract getDefaultMessage(): string;

  /**
   * Get error code for this rule
   * @protected - Override in subclasses
   */
  protected abstract getErrorCode(): string;

  /**
   * Get additional error context
   * @protected - Override in subclasses if needed
   */
  protected getErrorContext(value: T, context?: any): Record<string, any> {
    return { value };
  }
}

/**
 * Validator that chains multiple validation rules
 */
export class Validator<T = any> {
  private rules: ValidationRule[] = [];

  /**
   * Add a validation rule
   */
  add(rule: ValidationRule): this {
    this.rules.push(rule);
    return this;
  }

  /**
   * Add multiple rules
   */
  addAll(rules: ValidationRule[]): this {
    this.rules.push(...rules);
    return this;
  }

  /**
   * Validate an object against all rules
   */
  validate(data: T): ValidationResult {
    const errors: ValidationError[] = [];

    for (const rule of this.rules) {
      const result = rule.validate((data as any)[rule['field']], data);
      if (!result.valid) {
        errors.push(...result.errors);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate and throw on first error
   */
  validateOrThrow(data: T): void {
    const result = this.validate(data);
    if (!result.valid) {
      throw new ValidationException(result.errors);
    }
  }

  /**
   * Create a new validator instance
   */
  static create<T = any>(): Validator<T> {
    return new Validator<T>();
  }
}

/**
 * Exception thrown on validation failure
 */
export class ValidationException extends Error {
  constructor(public errors: ValidationError[]) {
    super(ValidationException.formatErrors(errors));
    this.name = 'ValidationException';
  }

  /**
   * Format errors as a single message
   */
  private static formatErrors(errors: ValidationError[]): string {
    return errors.map(e => `${e.field}: ${e.message}`).join('; ');
  }

  /**
   * Get errors as a plain object for JSON responses
   */
  toJSON() {
    return {
      error: 'Validation failed',
      errors: this.errors
    };
  }
}

// ============================================================================
// Common Validation Rules
// ============================================================================

/**
 * Required field validation
 */
export class RequiredRule extends ValidationRule {
  protected check(value: any): boolean {
    return value !== null && value !== undefined && value !== '';
  }

  protected getDefaultMessage(): string {
    return `${this.field} is required`;
  }

  protected getErrorCode(): string {
    return 'REQUIRED';
  }
}

/**
 * String length validation
 */
export class StringLengthRule extends ValidationRule<string> {
  constructor(
    field: string,
    private min?: number,
    private max?: number,
    message?: string
  ) {
    super(field, message);
  }

  protected check(value: string): boolean {
    if (!value) return true; // Use RequiredRule for required check

    const length = value.length;
    if (this.min !== undefined && length < this.min) return false;
    if (this.max !== undefined && length > this.max) return false;
    return true;
  }

  protected getDefaultMessage(): string {
    if (this.min && this.max) {
      return `${this.field} must be between ${this.min} and ${this.max} characters`;
    } else if (this.min) {
      return `${this.field} must be at least ${this.min} characters`;
    } else if (this.max) {
      return `${this.field} must be at most ${this.max} characters`;
    }
    return `${this.field} has invalid length`;
  }

  protected getErrorCode(): string {
    return 'STRING_LENGTH';
  }

  protected getErrorContext(value: string): Record<string, any> {
    return { value, length: value?.length, min: this.min, max: this.max };
  }
}

/**
 * Number range validation
 */
export class NumberRangeRule extends ValidationRule<number> {
  constructor(
    field: string,
    private min?: number,
    private max?: number,
    message?: string
  ) {
    super(field, message);
  }

  protected check(value: number): boolean {
    if (value === null || value === undefined) return true;

    if (this.min !== undefined && value < this.min) return false;
    if (this.max !== undefined && value > this.max) return false;
    return true;
  }

  protected getDefaultMessage(): string {
    if (this.min !== undefined && this.max !== undefined) {
      return `${this.field} must be between ${this.min} and ${this.max}`;
    } else if (this.min !== undefined) {
      return `${this.field} must be at least ${this.min}`;
    } else if (this.max !== undefined) {
      return `${this.field} must be at most ${this.max}`;
    }
    return `${this.field} is out of range`;
  }

  protected getErrorCode(): string {
    return 'NUMBER_RANGE';
  }

  protected getErrorContext(value: number): Record<string, any> {
    return { value, min: this.min, max: this.max };
  }
}

/**
 * Email format validation
 */
export class EmailRule extends ValidationRule<string> {
  private static EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  protected check(value: string): boolean {
    if (!value) return true; // Use RequiredRule for required check
    return EmailRule.EMAIL_REGEX.test(value);
  }

  protected getDefaultMessage(): string {
    return `${this.field} must be a valid email address`;
  }

  protected getErrorCode(): string {
    return 'INVALID_EMAIL';
  }
}

/**
 * URL format validation
 */
export class UrlRule extends ValidationRule<string> {
  protected check(value: string): boolean {
    if (!value) return true;

    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  protected getDefaultMessage(): string {
    return `${this.field} must be a valid URL`;
  }

  protected getErrorCode(): string {
    return 'INVALID_URL';
  }
}

/**
 * Enum value validation
 */
export class EnumRule<T extends string> extends ValidationRule<T> {
  constructor(
    field: string,
    private allowedValues: readonly T[],
    message?: string
  ) {
    super(field, message);
  }

  protected check(value: T): boolean {
    if (!value) return true;
    return this.allowedValues.includes(value);
  }

  protected getDefaultMessage(): string {
    return `${this.field} must be one of: ${this.allowedValues.join(', ')}`;
  }

  protected getErrorCode(): string {
    return 'INVALID_ENUM';
  }

  protected getErrorContext(value: T): Record<string, any> {
    return { value, allowedValues: this.allowedValues };
  }
}

/**
 * Custom validation with predicate function
 */
export class CustomRule<T = any> extends ValidationRule<T> {
  constructor(
    field: string,
    private predicate: (value: T, context?: any) => boolean,
    private errorMessage: string,
    private errorCode = 'CUSTOM_VALIDATION'
  ) {
    super(field, errorMessage);
  }

  protected check(value: T, context?: any): boolean {
    return this.predicate(value, context);
  }

  protected getDefaultMessage(): string {
    return this.errorMessage;
  }

  protected getErrorCode(): string {
    return this.errorCode;
  }
}
