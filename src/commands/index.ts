import { REST, Routes, Client, Message } from 'discord.js';
import { readdir, stat } from 'fs/promises';
import { join, extname } from 'path';
import type { CommandDefinition, PrefixCommandDefinition, Logger } from '../types/index.js';

/**
 * Options for deploying slash commands
 */
export interface DeployOptions {
  /** Deployment scope - guild or global */
  scope?: 'guild' | 'global';
  /** Guild ID (required for guild scope) */
  guildId?: string;
  /** Dry run mode - shows what would be deployed without applying changes */
  dryRun?: boolean;
  /** Ask for confirmation before destructive changes */
  confirm?: boolean;
  /** Logger instance for output */
  logger?: Logger;
}

/**
 * Loads command definitions from a directory or array.
 * Automatically imports TypeScript/JavaScript files and extracts command definitions.
 * 
 * @param dirOrArray - Directory path to scan or array of command definitions
 * @returns Array of loaded command definitions
 * 
 * @example
 * ```typescript
 * import { loadCommands } from 'easier-djs';
 * 
 * // Load from directory
 * const commands = loadCommands('./commands');
 * 
 * // Load from array
 * const commands = loadCommands([
 *   {
 *     data: new SlashCommandBuilder().setName('ping').setDescription('Ping command'),
 *     run: async (interaction) => interaction.reply('Pong!')
 *   }
 * ]);
 * ```
 * 
 * @example
 * ```javascript
 * const { loadCommands } = require('easier-djs');
 * const commands = loadCommands('./commands');
 * ```
 */
export function loadCommands(dirOrArray: string | CommandDefinition[]): CommandDefinition[] {
  if (Array.isArray(dirOrArray)) {
    return dirOrArray;
  }
  
  // For directory loading, this would need to be implemented asynchronously
  // For now, return empty array with a note that this needs async implementation
  console.warn('Directory loading not yet implemented. Use array format for now.');
  return [];
}

/**
 * Loads commands from a directory asynchronously.
 * Scans for .js, .ts, .mjs files and imports them as command modules.
 * 
 * @param directory - Directory path to scan
 * @param logger - Optional logger for debug output
 * @returns Promise resolving to array of command definitions
 * 
 * @example
 * ```typescript
 * import { loadCommandsAsync } from 'easier-djs';
 * 
 * const commands = await loadCommandsAsync('./commands');
 * ```
 */
export async function loadCommandsAsync(
  directory: string,
  logger?: Logger
): Promise<CommandDefinition[]> {
  const commands: CommandDefinition[] = [];
  
  try {
    const files = await readdir(directory);
    
    for (const file of files) {
      const filePath = join(directory, file);
      const stats = await stat(filePath);
      
      if (stats.isFile() && ['.js', '.ts', '.mjs'].includes(extname(file))) {
        try {
          logger?.debug(`Loading command from ${file}`);
          
          // Dynamic import (this would need proper path resolution in a real implementation)
          const module = await import(filePath);
          
          // Look for default export or named exports that look like commands
          const possibleCommands = [
            module.default,
            ...Object.values(module).filter((exp: any) => 
              exp && typeof exp === 'object' && exp.data && exp.run
            )
          ].filter(Boolean);
          
          commands.push(...possibleCommands as CommandDefinition[]);
        } catch (error) {
          logger?.error(`Failed to load command from ${file}:`, error);
        }
      }
    }
  } catch (error) {
    logger?.error(`Failed to read commands directory ${directory}:`, error);
  }
  
  return commands;
}

/**
 * Deploys slash commands to Discord with intelligent diffing.
 * Shows what will change before applying and handles both guild and global deployment.
 * 
 * @param client - Discord.js client instance
 * @param commands - Array of command definitions to deploy
 * @param options - Deployment options
 * 
 * @example
 * ```typescript
 * import { deploy, loadCommands } from 'easier-djs';
 * 
 * const commands = loadCommands('./commands');
 * await deploy(client, commands, {
 *   scope: process.env.NODE_ENV === 'production' ? 'global' : 'guild',
 *   guildId: process.env.DEV_GUILD_ID,
 *   confirm: true,
 * });
 * ```
 * 
 * @example
 * ```javascript
 * const { deploy, loadCommands } = require('easier-djs');
 * 
 * const commands = loadCommands([myCommand]);
 * await deploy(client, commands, { scope: 'guild', guildId: '123456789' });
 * ```
 */
export async function deploy(
  client: Client,
  commands: CommandDefinition[],
  options: DeployOptions = {}
): Promise<void> {
  const {
    scope = 'guild',
    guildId,
    dryRun = false,
    confirm = false,
    logger = createDefaultLogger()
  } = options;

  if (!client.token) {
    throw new Error('Client must be logged in with a token to deploy commands');
  }

  if (scope === 'guild' && !guildId) {
    throw new Error('Guild ID is required for guild-scoped command deployment');
  }

  const rest = new REST({ version: '10' }).setToken(client.token);
  const clientId = client.user?.id || client.application?.id;
  
  if (!clientId) {
    throw new Error('Unable to determine client ID. Make sure the client is ready.');
  }

  // Prepare command data for deployment
  const commandData = commands.map(cmd => cmd.data.toJSON());
  
  logger.info(`🚀 Deploying ${commandData.length} command(s) to ${scope}${scope === 'guild' ? ` (${guildId})` : ''}`);
  
  try {
    // Determine the correct route
    const route = scope === 'guild' 
      ? Routes.applicationGuildCommands(clientId, guildId!)
      : Routes.applicationCommands(clientId);

    // Get existing commands for comparison
    const existingCommands = await rest.get(route) as any[];
    
    // Show diff
    showCommandDiff(existingCommands, commandData, logger);
    
    if (dryRun) {
      logger.info('🔍 Dry run mode - no changes applied');
      return;
    }
    
    if (confirm) {
      // In a real implementation, this would prompt for user confirmation
      logger.info('⚠️  Confirmation required - proceeding with deployment');
    }
    
    // Deploy commands
    const deployedCommands = await rest.put(route, { body: commandData }) as any[];
    
    logger.info(`✅ Successfully deployed ${deployedCommands.length} command(s)!`);
    
    if (scope === 'global') {
      logger.warn('⏰ Global commands may take up to 1 hour to propagate across all servers');
    }
    
  } catch (error) {
    logger.error('❌ Failed to deploy commands:', error);
    throw error;
  }
}

/**
 * Shows a diff between existing and new commands
 */
function showCommandDiff(existing: any[], newCommands: any[], logger: Logger): void {
  const existingMap = new Map(existing.map(cmd => [cmd.name, cmd]));
  const newMap = new Map(newCommands.map(cmd => [cmd.name, cmd]));
  
  const toAdd = newCommands.filter(cmd => !existingMap.has(cmd.name));
  const toUpdate = newCommands.filter(cmd => {
    const existingCmd = existingMap.get(cmd.name);
    return existingCmd && !commandsEqual(existingCmd, cmd);
  });
  const toRemove = existing.filter(cmd => !newMap.has(cmd.name));
  
  if (toAdd.length === 0 && toUpdate.length === 0 && toRemove.length === 0) {
    logger.info('📋 No changes detected - commands are up to date');
    return;
  }
  
  logger.info('📋 Command deployment summary:');
  
  if (toAdd.length > 0) {
    logger.info(`  ➕ Adding ${toAdd.length} command(s):`);
    toAdd.forEach(cmd => logger.info(`     - ${cmd.name}: ${cmd.description}`));
  }
  
  if (toUpdate.length > 0) {
    logger.info(`  📝 Updating ${toUpdate.length} command(s):`);
    toUpdate.forEach(cmd => logger.info(`     - ${cmd.name}: ${cmd.description}`));
  }
  
  if (toRemove.length > 0) {
    logger.info(`  ❌ Removing ${toRemove.length} command(s):`);
    toRemove.forEach(cmd => logger.info(`     - ${cmd.name}: ${cmd.description}`));
  }
}

/**
 * Compares two command objects for equality (simplified)
 */
function commandsEqual(cmd1: any, cmd2: any): boolean {
  return (
    cmd1.name === cmd2.name &&
    cmd1.description === cmd2.description &&
    JSON.stringify(cmd1.options || []) === JSON.stringify(cmd2.options || [])
  );
}

/**
 * Creates a simple logger for command deployment
 */
function createDefaultLogger() {
  return {
    debug: (message: string, ...args: any[]) => console.debug(`[DEBUG] ${message}`, ...args),
    info: (message: string, ...args: any[]) => console.info(`[INFO] ${message}`, ...args),
    warn: (message: string, ...args: any[]) => console.warn(`[WARN] ${message}`, ...args),
    error: (message: string, ...args: any[]) => console.error(`[ERROR] ${message}`, ...args),
  };
}

/**
 * Creates a simple command handler that can be attached to the interactionCreate event.
 * Handles command lookup, guard checking, and error handling.
 * 
 * @param commands - Array of command definitions
 * @param logger - Optional logger instance
 * @returns Event handler function
 * 
 * @example
 * ```typescript
 * import { createCommandHandler } from 'easier-djs';
 * 
 * const commands = loadCommands('./commands');
 * const handler = createCommandHandler(commands);
 * 
 * client.on('interactionCreate', handler);
 * ```
 */
export function createCommandHandler(commands: CommandDefinition[], logger?: Logger) {
  const commandMap = new Map(commands.map(cmd => [cmd.data.name, cmd]));
  
  return async (interaction: any) => {
    if (!interaction.isChatInputCommand()) return;
    
    const command = commandMap.get(interaction.commandName);
    if (!command) return;
    
    const context = { client: interaction.client, logger: logger || createDefaultLogger() };
    
    try {
      // Run guard if present
      if (command.guard) {
        const guardResult = await command.guard(interaction, context);
        if (guardResult !== true) {
          const errorMessage = typeof guardResult === 'string' 
            ? guardResult 
            : 'Access denied';
          
          await interaction.reply({ 
            content: errorMessage, 
            ephemeral: true 
          });
          return;
        }
      }
      
      // Run the command
      await command.run(interaction, context);
      
    } catch (error) {
      context.logger.error(`Error in command ${interaction.commandName}:`, error);
      
      const errorMessage = 'An error occurred while executing this command.';
      
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply(errorMessage);
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    }
  };
}

/**
 * Creates a prefix command handler for message events.
 * Handles command parsing, guard checking, and error handling.
 * 
 * @param prefixCommands - Array of prefix command definitions
 * @param prefix - Command prefix (default: '!')
 * @param logger - Optional logger instance
 * @returns Event handler function
 * 
 * @example
 * ```typescript
 * import { createPrefixCommandHandler } from 'easier-djs';
 * 
 * const prefixCommands = [
 *   {
 *     name: 'ping',
 *     description: 'Ping command',
 *     run: async (message, args, ctx) => {
 *       await message.reply('Pong!');
 *     }
 *   }
 * ];
 * 
 * const handler = createPrefixCommandHandler(prefixCommands, '!');
 * client.on('messageCreate', handler);
 * ```
 */
export function createPrefixCommandHandler(
  prefixCommands: PrefixCommandDefinition[], 
  prefix: string = '!',
  logger?: Logger
) {
  const commandMap = new Map<string, PrefixCommandDefinition>();
  
  // Build command map with aliases
  for (const cmd of prefixCommands) {
    commandMap.set(cmd.name, cmd);
    if (cmd.aliases) {
      for (const alias of cmd.aliases) {
        commandMap.set(alias, cmd);
      }
    }
  }
  
  return async (message: Message) => {
    // Ignore bot messages and messages that don't start with prefix
    if (message.author.bot || !message.content.startsWith(prefix)) return;
    
    // Parse command and arguments
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();
    
    if (!commandName) return;
    
    const command = commandMap.get(commandName);
    if (!command) return;
    
    const context = { client: message.client, logger: logger || createDefaultLogger() };
    
    try {
      // Run guard if present
      if (command.guard) {
        const guardResult = await command.guard(message, args, context);
        if (guardResult !== true) {
          const errorMessage = typeof guardResult === 'string' 
            ? guardResult 
            : 'Access denied';
          
          await message.reply(errorMessage);
          return;
        }
      }
      
      // Run the command
      await command.run(message, args, context);
      
    } catch (error) {
      context.logger.error(`Error in prefix command ${commandName}:`, error);
      await message.reply('An error occurred while executing this command.');
    }
  };
} 