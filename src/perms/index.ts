// Permission helpers - TODO: Implement in v0.2
import type { GuildMember, ChatInputCommandInteraction } from 'discord.js';

/**
 * Check if a member has a specific permission.
 * Implementation coming in v0.2.
 */
export function hasPerm(_member: GuildMember, _perm: unknown): boolean {
  // This is a stub implementation
  return true;
}

/**
 * Require guild admin permissions.
 * Implementation coming in v0.2.
 */
export async function requireGuildAdmin(_interaction: ChatInputCommandInteraction): Promise<boolean> {
  console.warn('requireGuildAdmin not yet implemented - coming in v0.2');
  return false;
}

/**
 * Check if bot can send messages in a channel.
 * Implementation coming in v0.2.
 */
export async function canSend(_channel: unknown): Promise<boolean> {
  // This is a stub implementation
  return true;
} 