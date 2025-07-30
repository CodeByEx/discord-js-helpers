import type { Client, ChatInputCommandInteraction, SlashCommandBuilder, GuildMember, Message } from 'discord.js';

/**
 * Features that can be enabled in createClient to automatically configure intents
 */
export type Features = Array<
  | 'commands' 
  | 'messages' 
  | 'members' 
  | 'reactions' 
  | 'voice' 
  | 'v2' 
  | 'diagnostics'
>;

/**
 * Minimal logger interface that easier-djs expects
 */
export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

/**
 * Context passed to command handlers
 */
export interface CommandContext {
  client: Client;
  logger: Logger;
}

/**
 * Command definition structure for easier-djs
 */
export interface CommandDefinition {
  /** The slash command builder from discord.js */
  data: SlashCommandBuilder;
  /** The command handler function */
  run: (interaction: ChatInputCommandInteraction, ctx: CommandContext) => Promise<any>;
  /** Optional guard function that runs before the command */
  guard?: (interaction: ChatInputCommandInteraction, ctx: CommandContext) => Promise<boolean | string>;
}

/**
 * Prefix command definition structure
 */
export interface PrefixCommandDefinition {
  /** Command name/trigger */
  name: string;
  /** Command aliases */
  aliases?: string[];
  /** Command description */
  description?: string;
  /** The command handler function */
  run: (message: Message, args: string[], ctx: CommandContext) => Promise<any>;
  /** Optional guard function that runs before the command */
  guard?: (message: Message, args: string[], ctx: CommandContext) => Promise<boolean | string>;
  /** Whether this command should be hidden from help */
  hidden?: boolean;
}

/**
 * Configuration options for createClient
 */
export interface CreateClientOptions {
  /** Discord bot token (optional, defaults to process.env.DISCORD_TOKEN) */
  token?: string;
  /** Features to enable - automatically configures intents */
  features?: Features;
  /** Additional intents to add beyond what features provide */
  additionalIntents?: number[];
  /** Discord.js partials to enable */
  partials?: import('discord.js').Partials[];
  /** Whether to install default error middleware */
  handleErrors?: boolean;
  /** Logger instance to use */
  logger?: Logger;
}

/**
 * Cache adapter interface for pluggable caching
 */
export interface CacheAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
} 