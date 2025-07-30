// Cache helpers - TODO: Implement in v0.2
import type { CacheAdapter } from '../types/index.js';
import type { Client, Message, GuildMember } from 'discord.js';

/**
 * Safely get a message without throwing on partials.
 * Implementation coming in v0.2.
 */
export async function getMessageSafe(client: Client, channelId: string, messageId: string): Promise<Message | null> {
  console.warn('getMessageSafe not yet implemented - coming in v0.2');
  return null;
}

/**
 * Ensure a guild member is fetched and cached.
 * Implementation coming in v0.2.
 */
export async function ensureGuildMember(client: Client, guildId: string, userId: string): Promise<GuildMember | null> {
  console.warn('ensureGuildMember not yet implemented - coming in v0.2');
  return null;
}

/**
 * Memory cache adapter.
 * Implementation coming in v0.2.
 */
export function memoryCache(): CacheAdapter {
  console.warn('memoryCache not yet implemented - coming in v0.2');
  return {
    async get() { return null; },
    async set() { },
    async del() { }
  };
} 