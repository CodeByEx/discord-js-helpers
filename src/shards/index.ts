// Sharding helpers - TODO: Implement in v0.3

export interface AutoShardOptions {
  recommended?: number;
  totalGuildsHint?: number;
  spawnDelayMs?: number;
  logger?: any;
}

/**
 * Automatic sharding helper.
 * Implementation coming in v0.3.
 */
export function autoShard(entry: string, opts?: AutoShardOptions): any {
  console.warn('autoShard not yet implemented - coming in v0.3');
  return null;
}

/**
 * Shard health checking.
 * Implementation coming in v0.3.
 */
export async function shardHealth(manager: any): Promise<{ ok: boolean; details: any }> {
  console.warn('shardHealth not yet implemented - coming in v0.3');
  return { ok: false, details: {} };
} 