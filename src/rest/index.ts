import { REST, RESTPostAPIChannelMessageJSONBody, RESTPatchAPIChannelMessageJSONBody } from 'discord.js';
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
 * import { wrapRest } from 'discord-js-helpers';
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
  rest.post = async (route: any, options?: any) => {
    return await retryWithBackoff(
      () => originalPost(route, options),
      maxRetries,
      baseDelayMs,
      logger,
      'POST'
    );
  };

  // Enhanced PATCH with retry logic
  rest.patch = async (route: any, options?: any) => {
    return await retryWithBackoff(
      () => originalPatch(route, options),
      maxRetries,
      baseDelayMs,
      logger,
      'PATCH'
    );
  };

  // Enhanced DELETE with retry logic
  rest.delete = async (route: any, options?: any) => {
    return await retryWithBackoff(
      () => originalDelete(route, options),
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
  fn: () => Promise<any>,
  maxRetries: number,
  baseDelayMs: number,
  logger: Logger,
  method: string
): Promise<any> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry on client errors (4xx) except 429
      if (error.code >= 400 && error.code < 500 && error.code !== 429) {
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
    debug: (message: string, ...args: any[]) => console.debug(`[REST] ${message}`, ...args),
    info: (message: string, ...args: any[]) => console.info(`[REST] ${message}`, ...args),
    warn: (message: string, ...args: any[]) => console.warn(`[REST] ${message}`, ...args),
    error: (message: string, ...args: any[]) => console.error(`[REST] ${message}`, ...args),
  };
} 