# Styles Documentation

This directory contains the comprehensive styling system for the productivity dashboard, built on the Nord color palette and following UNIX philosophy principles.

## Architecture Overview

The styling system is organized into modular, composable layers:

```
src/lib/styles/
├── nord-theme.css      # Core theme variables and color system
├── components.css      # Component-specific styling
└── README.md          # This documentation
```

## Design Philosophy

### UNIX Principles Applied to CSS

1. **Single Responsibility**: Each CSS file serves one specific purpose
2. **Composition Over Inheritance**: Variables and utilities compose into complex styles
3. **Predictable Interface**: Consistent naming and behavior across all components
4. **Modularity**: Styles can be imported and used independently

### Color System Architecture

The Nord theme provides a systematic approach to color usage:

```css
/* Color categories follow logical groupings */
--nord0-3:   /* Polar Night - Backgrounds (dark to light) */
--nord4-6:   /* Snow Storm - Text (dark to light) */
--nord7-10:  /* Frost - Actions and accents */
--nord11-15: /* Aurora - Status and semantics */
```

## File Structure and Responsibilities

### `nord-theme.css`

**Purpose**: Core theme variables and foundational styling system.

**Key Features**:
- Complete Nord color palette as CSS variables
- Semantic color mappings (primary, success, error, etc.)
- Component-specific color assignments
- Layout and typography systems
- Accessibility enhancements

**Variable Categories**:

```css
/* Color System */
--nord0: #2e3440;           /* Primary background */
--color-primary: var(--nord8);  /* Semantic mapping */
--intensity-1: var(--nord14);   /* Component-specific */

/* Layout System */
--space-xs: 0.25rem;        /* Consistent spacing */
--radius-md: 0.375rem;      /* Border radius scale */
--shadow-lg: 0 10px...;     /* Elevation system */

/* Typography */
--font-size-base: 1rem;     /* Size scale */
--font-weight-medium: 500;  /* Weight scale */
--line-height-normal: 1.5;  /* Line height scale */
```

**Utility Classes**:
- Background utilities (`.bg-primary`, `.bg-elevated`)
- Text utilities (`.text-primary`, `.text-success`)
- Status utilities (`.text-error`, `.text-warning`)
- Interactive utilities (`.hover-lift`, `.focus-ring`)

### `components.css`

**Purpose**: Specialized styling for specific UI components.

**Component Categories**:

#### Timer Components
```css
.timer-display {
  /* Monospace font for precise time display */
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code';
  /* State-based styling */
}

.timer-display.active {
  color: var(--timer-active);
  border-color: var(--timer-active);
}
```

#### Intensity System
```css
.intensity-option[data-intensity="1"] {
  border-color: var(--intensity-1);
  /* Green for easy tasks */
}

.intensity-option[data-intensity="5"] {
  border-color: var(--intensity-5);
  /* Red for extreme difficulty */
}
```

#### Task Management
```css
.task-card {
  /* Extends base card styling */
  @extend .card-base;
  /* Adds task-specific interactions */
}

.task-card.dragging {
  transform: rotate(5deg);
  /* Visual feedback during drag operations */
}
```

#### Kanban Board Layout
```css
.kanban-board {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  /* Responsive column layout */
}

.drop-zone.drag-over {
  border-color: var(--color-primary);
  /* Visual feedback for drag targets */
}
```

## Color System Implementation

### Semantic Color Mapping

The theme establishes clear semantic meaning for colors:

```css
/* Status Colors */
--color-error: var(--nord11);      /* Red - Errors */
--color-warning: var(--nord12);    /* Orange - Warnings */
--color-info: var(--nord13);       /* Yellow - Information */
--color-success: var(--nord14);    /* Green - Success */
--color-purple: var(--nord15);     /* Purple - Creative */

/* Action Colors */
--color-primary: var(--nord8);     /* Main actions */
--color-secondary: var(--nord7);   /* Secondary actions */
--color-destructive: var(--nord11); /* Delete/remove */
```

### Intensity Color System

Tasks use a five-level intensity system with intuitive color mapping:

```css
--intensity-1: var(--nord14);  /* Green - Easy tasks */
--intensity-2: var(--nord7);   /* Cyan - Light tasks */
--intensity-3: var(--nord8);   /* Blue - Medium tasks */
--intensity-4: var(--nord12);  /* Orange - Hard tasks */
--intensity-5: var(--nord11);  /* Red - Extreme tasks */
```

### Background Hierarchy

Four-level background system for visual depth:

```css
--bg-primary: var(--nord0);    /* Main background */
--bg-secondary: var(--nord1);  /* Card backgrounds */
--bg-elevated: var(--nord2);   /* Elevated elements */
--bg-highest: var(--nord3);    /* Top-level elements */
```

## Component Styling Patterns

### Base Component Extensions

Components extend base styles for consistency:

```css
.btn-base {
  /* Foundation button styling */
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  transition: all var(--transition-normal);
}

.btn-primary {
  /* Extends base with primary styling */
  background-color: var(--color-primary);
  color: var(--nord0);
}
```

### State-Based Styling

Components use data attributes and classes for state:

```css
.task-card.selected {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(136, 192, 208, 0.1);
}

.intensity-option[data-intensity="3"].selected {
  background: var(--intensity-3);
  color: var(--nord0);
}
```

### Interactive Feedback

Consistent hover and focus states:

```css
.task-card:hover {
  border-color: var(--focus-ring);
  /* Subtle border change on hover */
}

.task-card:hover .task-actions {
  opacity: 1;
  /* Reveal actions on hover */
}
```

## Responsive Design Strategy

### Mobile-First Approach

```css
/* Base styles for mobile */
.kanban-board {
  grid-template-columns: 1fr;
  padding: var(--space-md);
}

/* Progressive enhancement for larger screens */
@media (min-width: 768px) {
  .kanban-board {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    padding: var(--space-lg);
  }
}
```

### Breakpoint System

- **Mobile**: `< 640px` - Single column, touch-optimized
- **Tablet**: `640px - 1024px` - Transitional layouts
- **Desktop**: `> 1024px` - Full multi-column layouts

### Touch-Friendly Interactions

```css
.mobile-toggle {
  min-width: 44px;  /* WCAG recommended minimum */
  min-height: 44px;
  /* Accessible touch targets */
}
```

## Accessibility Implementation

### Color Contrast

All color combinations meet WCAG AA standards:
- Text on backgrounds: 4.5:1 minimum ratio
- Large text: 3:1 minimum ratio
- Interactive elements: Enhanced contrast

### High Contrast Mode Support

```css
@media (prefers-contrast: high) {
  :root {
    --border-default: var(--border-strong);
    --text-secondary: var(--text-primary);
  }
  
  .btn-base, .card-base {
    border-width: 2px;
  }
}
```

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
}
```

### Focus Management

```css
:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

.btn-base:focus {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}
```

## Animation System

### Transition Variables

```css
--transition-fast: 0.1s ease;     /* Immediate feedback */
--transition-normal: 0.2s ease;   /* Standard transitions */
--transition-slow: 0.3s ease;     /* Deliberate animations */
--transition-bounce: 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Hover Effects

```css
.hover-lift {
  transition: transform var(--transition-normal);
}

.hover-lift:hover {
  transform: translateY(-1px);
}
```

### Loading States

```css
.task-card.dragging {
  transform: rotate(5deg);
  box-shadow: var(--shadow-xl);
  z-index: var(--z-modal);
}
```

## Typography System

### Font Scale

```css
--font-size-xs: 0.75rem;      /* 12px - Small labels */
--font-size-sm: 0.875rem;     /* 14px - Body text */
--font-size-base: 1rem;       /* 16px - Primary text */
--font-size-lg: 1.125rem;     /* 18px - Headings */
--font-size-xl: 1.25rem;      /* 20px - Large headings */
--font-size-2xl: 1.5rem;      /* 24px - Titles */
```

### Weight Scale

```css
--font-weight-normal: 400;    /* Body text */
--font-weight-medium: 500;    /* Emphasis */
--font-weight-semibold: 600;  /* Headings */
--font-weight-bold: 700;      /* Strong emphasis */
```

### Monospace Typography

```css
.timer-display {
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', monospace;
  /* Precise alignment for time display */
}
```

## Layout Systems

### Spacing Scale

```css
--space-xs: 0.25rem;   /* 4px - Tight spacing */
--space-sm: 0.5rem;    /* 8px - Standard spacing */
--space-md: 1rem;      /* 16px - Component spacing */
--space-lg: 1.5rem;    /* 24px - Section spacing */
--space-xl: 2rem;      /* 32px - Large spacing */
--space-2xl: 3rem;     /* 48px - Massive spacing */
```

### Grid Systems

```css
.kanban-board {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-lg);
}

.app-body {
  display: grid;
  grid-template-columns: 280px 1fr 280px;
  /* Three-column application layout */
}
```

### Flexbox Utilities

```css
.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-sm);
}
```

## Shadow System

### Elevation Levels

```css
--shadow-sm: 0 1px 2px...;     /* Subtle elevation */
--shadow-md: 0 4px 6px...;     /* Standard elevation */
--shadow-lg: 0 10px 15px...;   /* High elevation */
--shadow-xl: 0 20px 25px...;   /* Maximum elevation */
```

### Usage Guidelines

- `shadow-sm`: Card resting state
- `shadow-md`: Card hover state
- `shadow-lg`: Modal dialogs
- `shadow-xl`: Dragging elements

## Form Styling

### Input Components

```css
.input-base {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  transition: all var(--transition-normal);
}

.input-base:focus {
  border-color: var(--focus-ring);
  box-shadow: 0 0 0 3px rgba(136, 192, 208, 0.1);
}
```

### Select Styling

```css
.form-select {
  background-image: url("data:image/svg+xml...");
  background-position: right 0.5rem center;
  appearance: none;
  /* Custom dropdown arrow */
}
```

## Print Styles

```css
@media print {
  :root {
    --bg-primary: white;
    --text-primary: black;
    --border-default: #ccc;
  }
  
  .card-base {
    box-shadow: none;
    border: 1px solid #ccc;
  }
}
```

## Performance Considerations

### CSS Custom Properties

- Variables enable efficient theme switching
- Cascade reduces specificity conflicts
- Inheritance provides automatic updates

### Selector Efficiency

```css
/* Efficient: Uses class selectors */
.task-card.selected { }

/* Efficient: Uses attribute selectors for state */
.intensity-option[data-intensity="3"] { }

/* Avoid: Deep nesting and complex selectors */
```

### Critical CSS

Essential styles are inlined:
- CSS variables (theme foundation)
- Base typography
- Layout grid
- Animation transitions

## Maintenance Guidelines

### Adding New Colors

1. Add to appropriate Nord category
2. Create semantic mapping
3. Document usage patterns
4. Test accessibility compliance

### Component Styling

1. Extend base classes where possible
2. Use CSS variables for all colors
3. Follow naming conventions
4. Include responsive breakpoints

### Testing Checklist

- [ ] Color contrast ratios (WCAG AA)
- [ ] High contrast mode support
- [ ] Reduced motion compliance
- [ ] Touch target sizes (44px minimum)
- [ ] Keyboard focus indicators
- [ ] Print stylesheet compatibility

## Integration with Tailwind CSS

The Nord theme works alongside Tailwind:

```css
/* Nord variables integrate with Tailwind utilities */
.bg-nord8 { background-color: var(--nord8); }
.text-intensity-3 { color: var(--intensity-3); }

/* Custom utilities extend Tailwind */
.hover-lift { /* Custom Nord utility */ }
```

## Future Enhancement Patterns

### Theme Switching

```css
[data-theme="light"] {
  /* Light mode overrides */
  --bg-primary: var(--nord6);
  --text-primary: var(--nord1);
}
```

### Custom Component Variants

```css
.timer-display.compact {
  font-size: var(--font-size-lg);
  padding: var(--space-sm);
}
```

### Advanced Animations

```css
@keyframes taskComplete {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
```

This styling system provides a robust foundation that scales with the application while maintaining design consistency and accessibility standards. The modular architecture follows UNIX principles, making it easy to maintain and extend.