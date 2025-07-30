// Permission helpers - TODO: Implement in v0.2
import type { GuildMember, ChatInputCommandInteraction } from 'discord.js';

/**
 * Check if a member has a specific permission.
 * Implementation coming in v0.2.
 */
export function hasPerm(member: GuildMember, perm: any): boolean {
  console.warn('hasPerm not yet implemented - coming in v0.2');
  return false;
}

/**
 * Require guild admin permissions.
 * Implementation coming in v0.2.
 */
export async function requireGuildAdmin(interaction: ChatInputCommandInteraction): Promise<boolean> {
  console.warn('requireGuildAdmin not yet implemented - coming in v0.2');
  return false;
}

/**
 * Check if bot can send messages in a channel.
 * Implementation coming in v0.2.
 */
export async function canSend(channel: any): Promise<boolean> {
  console.warn('canSend not yet implemented - coming in v0.2');
  return false;
} 