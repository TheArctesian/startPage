# Validation Framework

## Overview

The validation framework provides a composable, extensible system for validating data throughout the application. It follows the **Open/Closed Principle** - new validation rules can be added without modifying existing code.

## SOLID Principles Applied

### 1. Single Responsibility Principle (SRP)
Each validator class has **one reason to change**:
- `CreateTaskValidator` - Validates task creation only
- `UpdateTaskValidator` - Validates task updates only
- `CompleteTaskValidator` - Validates task completion only

### 2. Open/Closed Principle (OCP) ⭐
- **Open for extension**: Add new rules by creating new `ValidationRule` subclasses
- **Closed for modification**: Existing validators don't change when adding rules
- Rules can be composed dynamically

### 3. Liskov Substitution Principle (LSP)
- All `ValidationRule` subclasses can be used interchangeably
- Custom rules can replace built-in rules
- Validators can be mocked for testing

### 4. Interface Segregation Principle (ISP)
- Each validator exposes only relevant methods
- Consumers only depend on what they need
- Base classes don't force unnecessary methods

### 5. Dependency Inversion Principle (DIP)
- High-level validators depend on `ValidationRule` abstraction
- Low-level rule implementations depend on the same abstraction
- Easy to inject custom rules

## Directory Structure

```
validation/
├── README.md                    # This file
├── index.ts                     # Main export point
├── base-validator.ts            # Base validation framework
├── task.validator.ts            # Task validation rules
├── project.validator.ts         # Project validation rules
└── quicklink.validator.ts       # QuickLink validation rules
```

## Core Concepts

### ValidationRule
Abstract base class for all validation rules. Implements Template Method pattern.

```typescript
abstract class ValidationRule<T> {
  validate(value: T, context?: any): ValidationResult;
  protected abstract check(value: T, context?: any): boolean;
  protected abstract getDefaultMessage(): string;
  protected abstract getErrorCode(): string;
}
```

### Validator
Chains multiple validation rules together.

```typescript
const validator = Validator.create()
  .add(new RequiredRule('name'))
  .add(new StringLengthRule('name', 1, 255));
```

### ValidationResult
Consistent result format across all validators.

```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}
```

## Usage Examples

### Basic Validation

```typescript
import { createTaskValidator } from '$lib/server/validation';

// In API route
export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json();

  // Validate
  const result = createTaskValidator.validate(data);

  if (!result.valid) {
    return json({
      error: 'Validation failed',
      errors: result.errors
    }, { status: 400 });
  }

  // Proceed with valid data...
};
```

### Validate and Throw

```typescript
import { createTaskValidator, ValidationException } from '$lib/server/validation';

try {
  createTaskValidator.validateOrThrow(data);
  // Data is valid, continue...
} catch (error) {
  if (error instanceof ValidationException) {
    return json(error.toJSON(), { status: 400 });
  }
  throw error;
}
```

### Custom Validation Rules

```typescript
import { Validator, CustomRule } from '$lib/server/validation';

const validator = Validator.create()
  .add(new CustomRule(
    'email',
    (value: string) => value.endsWith('@company.com'),
    'Email must be a company email address',
    'INVALID_COMPANY_EMAIL'
  ))
  .add(new CustomRule(
    'password',
    (value: string) => /^(?=.*[A-Z])(?=.*[0-9])/.test(value),
    'Password must contain uppercase and numbers',
    'WEAK_PASSWORD'
  ));
```

### Cross-Field Validation

```typescript
import { ValidationRule } from '$lib/server/validation';

class PasswordMatchRule extends ValidationRule<string> {
  protected check(value: string, context?: any): boolean {
    return value === context?.password;
  }

  protected getDefaultMessage(): string {
    return 'Passwords must match';
  }

  protected getErrorCode(): string {
    return 'PASSWORD_MISMATCH';
  }
}

const validator = Validator.create()
  .add(new PasswordMatchRule('confirmPassword'));

// Context object is passed for cross-field validation
validator.validate({
  password: 'secret123',
  confirmPassword: 'secret123'
});
```

### Business Rule Validation

```typescript
import { TaskBusinessRules } from '$lib/server/validation';

// Validate status transitions
const result = TaskBusinessRules.canTransitionTo('done', 'todo');
if (!result.valid) {
  return json({ errors: result.errors }, { status: 400 });
}

// Validate estimates
const estimateCheck = TaskBusinessRules.validateEstimateReasonable(480, 5);
// Returns warnings but doesn't block
```

## Built-in Validation Rules

### RequiredRule
```typescript
new RequiredRule('fieldName')
```
Ensures field is not null, undefined, or empty string.

### StringLengthRule
```typescript
new StringLengthRule('fieldName', min, max)
```
Validates string length within range.

### NumberRangeRule
```typescript
new NumberRangeRule('fieldName', min, max)
```
Validates number is within range.

### EmailRule
```typescript
new EmailRule('email')
```
Validates email format.

### UrlRule
```typescript
new UrlRule('url')
```
Validates URL format.

### EnumRule
```typescript
new EnumRule('status', ['todo', 'in_progress', 'done'])
```
Validates value is in allowed enum values.

### CustomRule
```typescript
new CustomRule(
  'fieldName',
  (value) => /* check */,
  'error message',
  'ERROR_CODE'
)
```
Custom validation logic.

## Creating Custom Rules

### Simple Custom Rule

```typescript
import { ValidationRule } from '$lib/server/validation';

export class PhoneNumberRule extends ValidationRule<string> {
  protected check(value: string): boolean {
    return /^\d{3}-\d{3}-\d{4}$/.test(value);
  }

  protected getDefaultMessage(): string {
    return `${this.field} must be in format XXX-XXX-XXXX`;
  }

  protected getErrorCode(): string {
    return 'INVALID_PHONE';
  }
}
```

### Configurable Custom Rule

```typescript
export class DateAfterRule extends ValidationRule<string> {
  constructor(
    field: string,
    private afterDate: Date,
    message?: string
  ) {
    super(field, message);
  }

  protected check(value: string): boolean {
    const date = new Date(value);
    return date > this.afterDate;
  }

  protected getDefaultMessage(): string {
    return `${this.field} must be after ${this.afterDate.toISOString()}`;
  }

  protected getErrorCode(): string {
    return 'DATE_TOO_EARLY';
  }

  protected getErrorContext(value: string): Record<string, any> {
    return {
      value,
      minimumDate: this.afterDate.toISOString()
    };
  }
}
```

## Composing Validators

### Reusable Validator Factories

```typescript
export function createEmailValidator() {
  return Validator.create()
    .add(new RequiredRule('email'))
    .add(new EmailRule('email'))
    .add(new StringLengthRule('email', undefined, 255));
}

export function createPasswordValidator() {
  return Validator.create()
    .add(new RequiredRule('password'))
    .add(new StringLengthRule('password', 8, 128))
    .add(new CustomRule(
      'password',
      (value: string) => /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])/.test(value),
      'Password must contain uppercase, lowercase, and numbers'
    ));
}

// Combine validators
const signupValidator = Validator.create()
  .addAll(createEmailValidator().rules)
  .addAll(createPasswordValidator().rules)
  .add(new RequiredRule('username'));
```

## Testing Validators

```typescript
import { createTaskValidator } from '$lib/server/validation';

describe('CreateTaskValidator', () => {
  it('should validate valid task data', () => {
    const validData = {
      title: 'Test task',
      projectId: 1,
      estimatedMinutes: 60,
      estimatedIntensity: 3,
      status: 'todo',
      priority: 'medium'
    };

    const result = createTaskValidator.validate(validData);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject task with invalid estimated minutes', () => {
    const invalidData = {
      title: 'Test',
      projectId: 1,
      estimatedMinutes: 2000, // Too high
      estimatedIntensity: 3
    };

    const result = createTaskValidator.validate(invalidData);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: 'estimatedMinutes',
        code: 'NUMBER_RANGE'
      })
    );
  });
});
```

## Best Practices

1. **Validate early** - Validate at API boundaries before business logic
   ```typescript
   // Good
   const result = validator.validate(data);
   if (!result.valid) return error(result.errors);
   await service.createTask(data);

   // Bad
   await service.createTask(data); // Validation inside service
   ```

2. **Use specific validators** - Don't reuse create validators for updates
   ```typescript
   // Good
   POST: createTaskValidator
   PUT: updateTaskValidator

   // Bad
   POST and PUT: same validator
   ```

3. **Compose rules** - Build complex validators from simple ones
   ```typescript
   // Good
   Validator.create()
     .addAll(baseRules)
     .add(specificRule);

   // Bad
   One giant custom rule with all logic
   ```

4. **Return meaningful errors** - Include context for debugging
   ```typescript
   protected getErrorContext(value: number): Record<string, any> {
     return { value, min: this.min, max: this.max };
   }
   ```

5. **Separate validation concerns**
   - **Format validation**: In validators (this layer)
   - **Business rules**: In services or business rule classes
   - **Permissions**: In auth guards

## Migration Guide

### From Inline Validation to Validators

**Before:**
```typescript
export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json();

  if (!data.title || data.title.length > 500) {
    return json({ error: 'Invalid title' }, { status: 400 });
  }

  if (!data.estimatedMinutes || data.estimatedMinutes < 1 || data.estimatedMinutes > 1440) {
    return json({ error: 'Invalid estimated minutes' }, { status: 400 });
  }

  // ... more validation
};
```

**After:**
```typescript
import { createTaskValidator, ValidationException } from '$lib/server/validation';

export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json();

  try {
    createTaskValidator.validateOrThrow(data);
  } catch (error) {
    if (error instanceof ValidationException) {
      return json(error.toJSON(), { status: 400 });
    }
    throw error;
  }

  // Data is valid, proceed...
};
```

## Future Enhancements

- [ ] Async validation rules (database lookups)
- [ ] Validation schemas from TypeScript types
- [ ] Auto-generate OpenAPI schemas from validators
- [ ] Validation rule caching
- [ ] Field-level validation (validate one field at a time)
- [ ] Conditional validation (rules based on other fields)

## Related Documentation

- [Repository Layer README](../repositories/README.md)
- [Service Layer README](../services/README.md)
- [API Routes Guide](../../../routes/api/README.md)
