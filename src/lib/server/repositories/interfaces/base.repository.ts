/**
 * Base Repository Interface
 *
 * Provides generic CRUD operations following the Repository Pattern.
 * This abstraction allows for:
 * - Dependency Inversion: High-level modules don't depend on database details
 * - Open/Closed: Can add new repositories without modifying existing code
 * - Testability: Easy to mock for unit tests
 *
 * @template T - The entity type (e.g., Task, Project)
 * @template CreateDTO - Data transfer object for creation
 * @template UpdateDTO - Data transfer object for updates
 * @template FilterDTO - Filters for querying
 */
export interface IBaseRepository<T, CreateDTO, UpdateDTO, FilterDTO = any> {
  /**
   * Find all entities matching the filter criteria
   * @param filters - Optional filter criteria
   * @returns Promise resolving to array of entities
   */
  findAll(filters?: FilterDTO): Promise<T[]>;

  /**
   * Find a single entity by ID
   * @param id - Entity identifier
   * @returns Promise resolving to entity or null if not found
   */
  findById(id: number): Promise<T | null>;

  /**
   * Find a single entity matching filter criteria
   * @param filters - Filter criteria
   * @returns Promise resolving to entity or null if not found
   */
  findOne(filters: Partial<FilterDTO>): Promise<T | null>;

  /**
   * Create a new entity
   * @param data - Entity creation data
   * @returns Promise resolving to created entity
   */
  create(data: CreateDTO): Promise<T>;

  /**
   * Update an existing entity
   * @param id - Entity identifier
   * @param data - Partial entity data to update
   * @returns Promise resolving to updated entity
   */
  update(id: number, data: UpdateDTO): Promise<T>;

  /**
   * Delete an entity by ID
   * @param id - Entity identifier
   * @returns Promise resolving to boolean indicating success
   */
  delete(id: number): Promise<boolean>;

  /**
   * Count entities matching filter criteria
   * @param filters - Optional filter criteria
   * @returns Promise resolving to count
   */
  count(filters?: FilterDTO): Promise<number>;

  /**
   * Check if an entity exists
   * @param id - Entity identifier
   * @returns Promise resolving to boolean
   */
  exists(id: number): Promise<boolean>;
}

/**
 * Pagination options for repository queries
 */
export interface PaginationOptions {
  /** Number of items per page */
  limit: number;
  /** Number of items to skip */
  offset: number;
}

/**
 * Sorting options for repository queries
 */
export interface SortOptions {
  /** Field to sort by */
  field: string;
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  /** Array of items in current page */
  items: T[];
  /** Total count of items matching filter */
  total: number;
  /** Current page number (0-indexed) */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
}
