// i18n helpers - TODO: Implement in v0.3
import type { Interaction } from 'discord.js';

export type Dict = Record<string, Record<string, string>>;

/**
 * Create an i18n function for localized responses.
 * Implementation coming in v0.3.
 */
export function createI18n(dict: Dict): (i: Interaction, key: string, vars?: Record<string, string | number>) => string {
  console.warn('createI18n not yet implemented - coming in v0.3');
  return (i: Interaction, key: string, vars?: Record<string, string | number>) => {
    return key; // Return key as fallback
  };
} 