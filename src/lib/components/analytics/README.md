# Analytics Components Documentation

This directory contains data visualization and reporting components using D3.js, following UNIX philosophy: specialized, composable analytics tools.

## Architecture Overview

```
src/lib/components/analytics/
├── AccuracyChart.svelte       # Estimation accuracy trends visualization
├── TimeChart.svelte           # Time tracking charts (daily/weekly/project)
├── AnalyticsDashboard.svelte  # Main analytics interface
├── ReportsView.svelte         # Productivity reports generator
└── README.md                  # This documentation
```

## Design Philosophy

### UNIX Principles Applied

1. **Single Responsibility**: Each component handles one type of visualization
2. **Composable Data**: Charts can be combined and reused in different contexts
3. **Predictable Interface**: Consistent props and event patterns across components
4. **Data-Driven**: All visualizations react to data changes automatically

### D3.js Integration Strategy

```typescript
// Reactive data processing
$: chartData = processData(rawData, chartType, timeRange);
$: if (chartContainer && chartData.length > 0) {
  drawChart();
}

// Responsive chart resizing
onMount(() => {
  resizeObserver = new ResizeObserver(() => drawChart());
  resizeObserver.observe(chartContainer);
});
```

## Component Structure

### `AccuracyChart.svelte` - Estimation Accuracy Visualization

**Purpose**: Displays time and intensity estimation accuracy trends over time.

**Features**:
- Dual-line chart for time and intensity accuracy
- Configurable time ranges (7d, 30d, 90d, all)
- Interactive tooltips with detailed information
- Reference line at 80% accuracy threshold
- Responsive design with mobile adaptations
- Empty state handling for no data

**Props**:
```typescript
export let tasks: TaskWithDetails[] = [];
export let chartType: 'time' | 'intensity' | 'both' = 'both';
export let timeRange: '7d' | '30d' | '90d' | 'all' = '30d';
```

**Data Processing**:
```typescript
// Time accuracy calculation
const timeAccuracy = estimatedMinutes > 0 ? 
  Math.max(0, (1 - Math.abs(actualMinutes - estimatedMinutes) / estimatedMinutes) * 100) : 0;

// Intensity accuracy calculation  
const intensityAccuracy = Math.max(0, (1 - Math.abs(actualIntensity - estimatedIntensity) / 4) * 100);
```

**D3.js Implementation**:
```typescript
// Scales
const xScale = d3.scaleTime()
  .domain(d3.extent(data, d => d.date))
  .range([0, innerWidth]);

const yScale = d3.scaleLinear()
  .domain([0, 100])
  .range([innerHeight, 0]);

// Line generators
const line = d3.line<AccuracyPoint>()
  .defined(d => d.accuracy !== null)
  .x(d => xScale(d.date))
  .y(d => yScale(d.accuracy))
  .curve(d3.curveMonotoneX);
```

### `TimeChart.svelte` - Time Tracking Visualization

**Purpose**: Displays time spent patterns across different dimensions.

**Features**:
- Multiple chart types: daily line chart, weekly line chart, project bar chart
- Configurable time ranges and aggregation periods
- Interactive tooltips and hover effects
- Area charts for daily/weekly views
- Horizontal bar charts for project comparison
- Loading states and error handling

**Props**:
```typescript
export let tasks: TaskWithDetails[] = [];
export let projects: Project[] = [];
export let chartType: 'daily' | 'weekly' | 'project' = 'daily';
export let timeRange: '7d' | '30d' | '90d' = '30d';
```

**Chart Types**:

1. **Daily/Weekly Line Charts**:
```typescript
// Time aggregation by period
const grouped = d3.group(tasks, d => {
  const date = new Date(d.completedAt!);
  return timeUnit.floor(date).toISOString();
});

// Area chart for better visual impact
const area = d3.area<TimePoint>()
  .x(d => xScale(d.date))
  .y0(innerHeight)
  .y1(d => yScale(d.value))
  .curve(d3.curveMonotoneX);
```

2. **Project Bar Charts**:
```typescript
// Horizontal bars for project comparison
const xScale = d3.scaleBand()
  .domain(data.map(d => d.label))
  .range([0, innerWidth])
  .padding(0.1);

// Color coding for projects
const colors = ['var(--nord8)', 'var(--nord15)', 'var(--nord14)'];
```

### `AnalyticsDashboard.svelte` - Main Analytics Interface

**Purpose**: Orchestrates multiple analytics components and provides summary metrics.

**Features**:
- Real-time data loading from API endpoints
- Summary metrics grid with key performance indicators
- Integrated chart controls and filtering
- Productivity score calculation
- Insights and recommendations generation
- Responsive layout with mobile optimization
- Error handling and loading states

**Key Metrics**:
```typescript
interface SummaryMetrics {
  totalTasks: number;
  totalHours: number;
  avgTimeAccuracy: number;
  avgIntensityAccuracy: number;
  productivityScore: number;
}
```

**Productivity Score Algorithm**:
```typescript
const productivityScore = Math.round(
  (completionRate * 0.3) +      // 30% weight on task completion
  (timeAccuracy * 0.3) +        // 30% weight on time estimation
  (intensityAccuracy * 0.2) +   // 20% weight on intensity estimation  
  (consistency * 0.2)           // 20% weight on daily consistency
) * 100;
```

**Data Flow**:
```typescript
// Parallel data loading
const [tasksResponse, projectsResponse] = await Promise.all([
  fetch('/api/tasks'),
  fetch('/api/projects')
]);

// Reactive metric calculations
$: completedTasks = tasks.filter(t => t.status === 'done');
$: averageAccuracy = calculateAverageAccuracy(completedTasks);
$: productivityScore = calculateProductivityScore(completedTasks);
```

### `ReportsView.svelte` - Productivity Reports Generator

**Purpose**: Generates detailed productivity reports for different time periods.

**Features**:
- Daily, weekly, and monthly report generation
- Date range selection with calendar input
- Project breakdown analysis
- Task intensity distribution
- Daily completion patterns
- Productivity trend analysis
- Actionable insights and recommendations
- Print-friendly layout options

**Report Structure**:
```typescript
interface ReportData {
  period: string;
  totalTasks: number;
  completedTasks: number;
  totalTimeSpent: number;
  averageTaskTime: number;
  projectBreakdown: ProjectStats[];
  intensityBreakdown: IntensityStats[];
  dailyPattern: DailyStats[];
  productivityTrend: 'up' | 'down' | 'stable';
  insights: string[];
}
```

**Report Generation Logic**:
```typescript
// Dynamic date range calculation
switch (reportType) {
  case 'daily':
    startDate = new Date(selectedDate);
    endDate = new Date(selectedDate);
    endDate.setDate(endDate.getDate() + 1);
    break;
  case 'weekly':
    startDate = d3.timeWeek.floor(selectedDate);
    endDate = d3.timeWeek.offset(startDate, 1);
    break;
  case 'monthly':
    startDate = d3.timeMonth.floor(selectedDate);
    endDate = d3.timeMonth.offset(startDate, 1);
    break;
}
```

**Insights Engine**:
```typescript
// Automated insight generation
const insights: string[] = [];

if (avgTaskTime > 120) {
  insights.push('Tasks taking longer than average. Consider breaking them down.');
} else if (avgTaskTime < 30) {
  insights.push('Quick task completion - good efficiency or small tasks.');
}

if (highIntensityPercentage > 50) {
  insights.push('High intensity focus! Balance with easier tasks to avoid burnout.');
}

if (productivityTrend === 'up') {
  insights.push('Productivity trending upward! Keep up the momentum.');
}
```

## D3.js Implementation Patterns

### Responsive Chart Framework

```typescript
// Standard chart setup pattern
function drawChart() {
  // Clear previous chart
  d3.select(container).selectAll('*').remove();
  
  // Dynamic dimensions
  const containerRect = container.getBoundingClientRect();
  width = containerRect.width || 800;
  height = Math.min(400, width * 0.5);
  
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  
  // Create SVG with responsive attributes
  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height);
}
```

### Interactive Features

```typescript
// Tooltip system
const tooltip = d3.select('body').append('div')
  .attr('class', 'chart-tooltip')
  .style('opacity', 0);

// Mouse interaction overlay
g.append('rect')
  .attr('width', innerWidth)
  .attr('height', innerHeight)
  .attr('fill', 'transparent')
  .on('mousemove', handleMouseMove)
  .on('mouseout', hideTooltip);
```

### Accessibility Integration

```typescript
// Screen reader support
svg.append('title')
  .text('Estimation accuracy chart showing time and intensity trends');

// Keyboard navigation
svg.attr('tabindex', 0)
  .on('keydown', handleKeyNavigation);

// High contrast support
@media (prefers-contrast: high) {
  :global(.chart .grid line) {
    stroke-opacity: 0.8;
  }
}
```

## Data Processing Utilities

### Time Aggregation

```typescript
// Flexible time grouping
function groupByTimeUnit(tasks: Task[], unit: d3.TimeInterval): Map<string, Task[]> {
  return d3.group(tasks, task => {
    const date = new Date(task.completedAt!);
    return unit.floor(date).toISOString();
  });
}

// Usage examples
const dailyGroups = groupByTimeUnit(tasks, d3.timeDay);
const weeklyGroups = groupByTimeUnit(tasks, d3.timeWeek);
const monthlyGroups = groupByTimeUnit(tasks, d3.timeMonth);
```

### Accuracy Calculations

```typescript
// Reusable accuracy calculation
function calculateAccuracy(estimated: number, actual: number, scale: number): number {
  if (estimated <= 0 || actual <= 0) return 0;
  const difference = Math.abs(actual - estimated);
  const maxError = scale === 4 ? 4 : estimated; // Intensity vs time scale
  return Math.max(0, (1 - difference / maxError) * 100);
}

// Time accuracy (percentage-based)
const timeAccuracy = calculateAccuracy(estimatedMinutes, actualMinutes, estimatedMinutes);

// Intensity accuracy (fixed 1-5 scale)  
const intensityAccuracy = calculateAccuracy(estimatedIntensity, actualIntensity, 4);
```

### Statistical Analysis

```typescript
// Trend analysis
function calculateTrend(current: number, previous: number, threshold: number = 0.1): 'up' | 'down' | 'stable' {
  const changeRatio = (current - previous) / Math.max(1, previous);
  if (changeRatio > threshold) return 'up';
  if (changeRatio < -threshold) return 'down';
  return 'stable';
}

// Consistency measurement
function calculateConsistency(values: number[]): number {
  if (values.length < 2) return 0.5;
  const mean = d3.mean(values) || 0;
  const variance = d3.variance(values) || 0;
  const coefficient = Math.sqrt(variance) / Math.max(1, mean);
  return Math.max(0, 1 - coefficient);
}
```

## Styling and Theme Integration

### Nord Theme Colors

```css
/* Chart-specific color mappings */
--chart-primary: var(--nord8);      /* Main data lines */
--chart-secondary: var(--nord7);    /* Secondary data */
--chart-accent: var(--nord15);      /* Highlights */
--chart-success: var(--nord14);     /* Positive trends */
--chart-warning: var(--nord12);     /* Warnings */
--chart-error: var(--nord11);       /* Negative trends */

/* Intensity level colors */
--intensity-1: var(--nord14);       /* Easy - Green */
--intensity-2: var(--nord7);        /* Light - Cyan */
--intensity-3: var(--nord8);        /* Medium - Blue */
--intensity-4: var(--nord12);       /* Hard - Orange */
--intensity-5: var(--nord11);       /* Extreme - Red */
```

### Chart Styling Pattern

```css
/* Consistent chart styling */
.chart-container {
  background: var(--bg-elevated);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-default);
  padding: var(--space-md);
}

/* Axis styling */
:global(.chart .x-axis),
:global(.chart .y-axis) {
  color: var(--text-secondary);
  font-size: var(--font-size-xs);
}

/* Grid lines */
:global(.chart .grid line) {
  stroke: var(--border-subtle);
  stroke-opacity: 0.5;
}

/* Interactive elements */
:global(.chart .dot:hover) {
  r: 6;
  cursor: pointer;
}
```

## Performance Optimization

### Efficient Rendering

```typescript
// Debounced resize handling
let resizeTimeout: number;
function handleResize() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(drawChart, 100);
}

// Data memoization
const memoizedData = useMemo(() => {
  return processChartData(tasks, timeRange);
}, [tasks, timeRange]);
```

### Memory Management

```typescript
// Cleanup on component destroy
onDestroy(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  
  // Remove tooltips from DOM
  d3.select('body').selectAll('.chart-tooltip').remove();
  
  // Clear any timeouts
  clearTimeout(resizeTimeout);
});
```

### Bundle Optimization

```typescript
// Selective D3 imports for smaller bundle size
import { select, selectAll } from 'd3-selection';
import { scaleTime, scaleLinear, scaleBand } from 'd3-scale';
import { line, area } from 'd3-shape';
import { timeDay, timeWeek, timeMonth } from 'd3-time';
import { group, mean, variance, extent, max, sum } from 'd3-array';
import { axisBottom, axisLeft } from 'd3-axis';
import { timeFormat } from 'd3-time-format';
import { curveMonotoneX } from 'd3-shape';
```

## Usage Patterns

### Basic Chart Integration

```svelte
<script>
  import AccuracyChart from './AccuracyChart.svelte';
  import TimeChart from './TimeChart.svelte';
  
  let tasks = [];
  let projects = [];
  let timeRange = '30d';
  
  // Load data
  onMount(async () => {
    const response = await fetch('/api/tasks');
    tasks = await response.json();
  });
</script>

<!-- Accuracy trends -->
<AccuracyChart 
  {tasks} 
  chartType="both"
  {timeRange}
/>

<!-- Time tracking -->
<TimeChart 
  {tasks}
  {projects}
  chartType="daily"
  {timeRange}
/>
```

### Custom Dashboard Composition

```svelte
<script>
  import AnalyticsDashboard from './AnalyticsDashboard.svelte';
  
  let showAnalytics = false;
  
  function handleShowAnalytics() {
    showAnalytics = true;
  }
</script>

<button onclick={handleShowAnalytics}>
  View Analytics 📊
</button>

<AnalyticsDashboard bind:isOpen={showAnalytics} />
```

### Report Generation

```svelte
<script>
  import ReportsView from './ReportsView.svelte';
  
  let showReports = false;
  let reportType = 'weekly';
  let selectedDate = new Date().toISOString().split('T')[0];
</script>

<ReportsView 
  bind:isOpen={showReports}
  {reportType}
  {selectedDate}
/>
```

## Testing Strategy

### Data Processing Tests

```typescript
// Test accuracy calculations
test('calculates time accuracy correctly', () => {
  const result = calculateTimeAccuracy(60, 50); // Estimated 60, actual 50
  expect(result).toBeCloseTo(83.33); // 83.33% accuracy
});

// Test trend analysis
test('detects upward trend', () => {
  const trend = calculateTrend(110, 100);
  expect(trend).toBe('up');
});
```

### Chart Rendering Tests

```typescript
// Test chart creation
test('renders accuracy chart', () => {
  const { container } = render(AccuracyChart, {
    tasks: mockTasks,
    chartType: 'both'
  });
  
  expect(container.querySelector('svg')).toBeInTheDocument();
  expect(container.querySelector('.time-accuracy-line')).toBeInTheDocument();
});
```

### Integration Tests

```typescript
// Test dashboard data flow
test('analytics dashboard loads and displays data', async () => {
  const { getByText, findByText } = render(AnalyticsDashboard, {
    isOpen: true
  });
  
  await findByText('Analytics Dashboard');
  expect(getByText(/Tasks Completed/)).toBeInTheDocument();
});
```

## Future Enhancement Patterns

### Advanced Visualizations

```typescript
// Heatmap for daily productivity patterns
function drawProductivityHeatmap(data: DailyStats[][]) {
  // Weekly x daily grid showing productivity levels
}

// Sankey diagram for project time flow
function drawProjectTimeFlow(projects: Project[], tasks: Task[]) {
  // Show time allocation across projects and phases
}
```

### Real-time Updates

```typescript
// WebSocket integration for live data
const ws = new WebSocket('ws://localhost:3000/analytics');
ws.onmessage = (event) => {
  const newData = JSON.parse(event.data);
  updateCharts(newData);
};
```

### Export Capabilities

```typescript
// SVG to PNG export
function exportChart(chartElement: SVGElement, filename: string) {
  const svgData = new XMLSerializer().serializeToString(chartElement);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Convert SVG to PNG and download
  const img = new Image();
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
    });
  };
  
  img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
}
```

This analytics system provides comprehensive productivity insights while maintaining the UNIX philosophy of composable, focused components that work together seamlessly.