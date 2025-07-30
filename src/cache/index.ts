import type { CacheAdapter } from '../types/index.js';
import type { Client, Message, GuildMember } from 'discord.js';

/**
 * Safely get a message without throwing on partials.
 * Handles cases where the message might not be cached or accessible.
 * 
 * @param client - Discord.js client
 * @param channelId - Channel ID where the message is located
 * @param messageId - Message ID to fetch
 * @returns Promise resolving to the message or null if not found
 * 
 * @example
 * ```typescript
 * import { getMessageSafe } from 'discord-js-simplified';
 * 
 * const message = await getMessageSafe(client, '123456789', '987654321');
 * if (message) {
 *   console.log('Message content:', message.content);
 * }
 * ```
 */
export async function getMessageSafe(client: Client, channelId: string, messageId: string): Promise<Message | null> {
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel?.isTextBased()) return null;
    
    const message = await channel.messages.fetch(messageId);
    return message;
  } catch {
    // Message not found or not accessible
    return null;
  }
}

/**
 * Ensure a guild member is fetched and cached.
 * Handles cases where the member might not be cached.
 * 
 * @param client - Discord.js client
 * @param guildId - Guild ID where the member is located
 * @param userId - User ID to fetch
 * @returns Promise resolving to the guild member or null if not found
 * 
 * @example
 * ```typescript
 * import { ensureGuildMember } from 'discord-js-simplified';
 * 
 * const member = await ensureGuildMember(client, '123456789', '987654321');
 * if (member) {
 *   console.log('Member nickname:', member.nickname);
 * }
 * ```
 */
export async function ensureGuildMember(client: Client, guildId: string, userId: string): Promise<GuildMember | null> {
  try {
    const guild = await client.guilds.fetch(guildId);
    const member = await guild.members.fetch(userId);
    return member;
  } catch {
    // Member not found or not accessible
    return null;
  }
}

/**
 * In-memory cache adapter with TTL support.
 * Simple cache implementation for development and small-scale usage.
 * 
 * @returns CacheAdapter instance
 * 
 * @example
 * ```typescript
 * import { memoryCache } from 'discord-js-simplified';
 * 
 * const cache = memoryCache();
 * await cache.set('user:123', { name: 'John', age: 25 }, 3600); // 1 hour TTL
 * const user = await cache.get('user:123');
 * ```
 */
export function memoryCache(): CacheAdapter {
  const store = new Map<string, { value: unknown; expires: number }>();
  
  // Cleanup expired entries every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.expires > 0 && entry.expires < now) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000);
  
  return {
    async get<T>(key: string): Promise<T | null> {
      const entry = store.get(key);
      if (!entry) return null;
      
      if (entry.expires > 0 && entry.expires < Date.now()) {
        store.delete(key);
        return null;
      }
      
      return entry.value as T;
    },
    
    async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
      const expires = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : 0;
      store.set(key, { value, expires });
    },
    
    async del(key: string): Promise<void> {
      store.delete(key);
    }
  };
}

/**
 * Redis cache adapter (requires Redis connection).
 * For production use with Redis server.
 * 
 * @param url - Redis connection URL
 * @returns CacheAdapter instance
 * 
 * @example
 * ```typescript
 * import { redisCache } from 'discord-js-simplified';
 * 
 * const cache = redisCache('redis://localhost:6379');
 * await cache.set('session:123', { userId: '456' }, 1800); // 30 min TTL
 * ```
 */
export function redisCache(_url: string): CacheAdapter {
  // This would require a Redis client like 'redis' or 'ioredis'
  // For now, we'll provide a stub implementation
  console.warn('Redis cache adapter requires Redis client. Install "redis" or "ioredis" package.');
  
  return {
    async get<T>(): Promise<T | null> {
      return null;
    },
    
    async set(): Promise<void> {
      // No-op for now
    },
    
    async del(): Promise<void> {
      // No-op for now
    }
  };
} 