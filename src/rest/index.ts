// REST helpers - Rate-limit-safe REST + retries + idempotency
// TODO: Implement in v0.2

export interface RestOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  logger?: any;
}

/**
 * Wraps a REST instance with rate limiting and retry logic.
 * Implementation coming in v0.2.
 */
export function wrapRest(rest: any, opts?: RestOptions): any {
  console.warn('wrapRest not yet implemented - coming in v0.2');
  return rest;
} 