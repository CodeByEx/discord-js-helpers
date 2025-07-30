import { REST } from 'discord.js';
import type { Logger } from '../types/index.js';

export interface RestOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  logger?: Logger;
}

/**
 * Wraps a REST instance with rate limiting and retry logic.
 * Provides exponential backoff with jitter for failed requests.
 * 
 * @param rest - Discord.js REST instance
 * @param options - Configuration options
 * @returns Enhanced REST instance with retry logic
 * 
 * @example
 * ```typescript
 * import { REST } from 'discord.js';
 * import { wrapRest } from 'djs-helper-kit';
 * 
 * const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);
 * const enhancedRest = wrapRest(rest, { maxRetries: 3, baseDelayMs: 1000 });
 * ```
 */
export function wrapRest(rest: REST, options: RestOptions = {}): REST {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    logger = createDefaultLogger()
  } = options;

  // Store original methods
  const originalPost = rest.post.bind(rest);
  const originalPatch = rest.patch.bind(rest);
  const originalDelete = rest.delete.bind(rest);

  // Enhanced POST with retry logic
  rest.post = async (route: unknown, options?: unknown) => {
    return await retryWithBackoff(
      () => originalPost(route as `/${string}`, options as Record<string, unknown>),
      maxRetries,
      baseDelayMs,
      logger,
      'POST'
    );
  };

  // Enhanced PATCH with retry logic
  rest.patch = async (route: unknown, options?: unknown) => {
    return await retryWithBackoff(
      () => originalPatch(route as `/${string}`, options as Record<string, unknown>),
      maxRetries,
      baseDelayMs,
      logger,
      'PATCH'
    );
  };

  // Enhanced DELETE with retry logic
  rest.delete = async (route: unknown, options?: unknown) => {
    return await retryWithBackoff(
      () => originalDelete(route as `/${string}`, options as Record<string, unknown>),
      maxRetries,
      baseDelayMs,
      logger,
      'DELETE'
    );
  };

  return rest;
}

/**
 * Retry function with exponential backoff and jitter
 */
async function retryWithBackoff(
  fn: () => Promise<unknown>,
  maxRetries: number,
  baseDelayMs: number,
  logger: Logger,
  method: string
): Promise<unknown> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;

      // Don't retry on client errors (4xx) except 429
      const errorObj = error as Record<string, unknown>;
      if (typeof errorObj.code === 'number' && errorObj.code >= 400 && errorObj.code < 500 && errorObj.code !== 429) {
        throw error;
      }

      // Don't retry on server errors (5xx) after max retries
      if (attempt === maxRetries) {
        logger.error(`Failed ${method} request after ${maxRetries} retries:`, error);
        throw error;
      }

      // Calculate delay with exponential backoff and jitter
      const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * 250;
      
      logger.warn(`${method} request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Creates a simple logger for REST operations
 */
function createDefaultLogger(): Logger {
  return {
    debug: (message: string, ...args: unknown[]) => console.debug(`[REST] ${message}`, ...args),
    info: (message: string, ...args: unknown[]) => console.info(`[REST] ${message}`, ...args),
    warn: (message: string, ...args: unknown[]) => console.warn(`[REST] ${message}`, ...args),
    error: (message: string, ...args: unknown[]) => console.error(`[REST] ${message}`, ...args),
  };
} 