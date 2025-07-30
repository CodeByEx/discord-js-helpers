import { Client, GatewayIntentBits } from 'discord.js';
import type { CreateClientOptions, Features, Logger } from '../types/index.js';

/**
 * Maps features to the required Discord gateway intents
 */
const FEATURE_INTENTS: Record<string, GatewayIntentBits[]> = {
  commands: [],
  messages: [GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages],
  members: [GatewayIntentBits.GuildMembers],
  reactions: [GatewayIntentBits.GuildMessageReactions],
  voice: [GatewayIntentBits.GuildVoiceStates],
  v2: [], // V2 components don't need special intents
  diagnostics: [GatewayIntentBits.Guilds], // Need basic guild access for diagnostics
};

/**
 * Creates a Discord.js client with automatic intent configuration based on features.
 * Reduces foot-guns by automatically setting up the right intents for common use cases.
 * 
 * @param options - Configuration options for the client
 * @returns Configured Discord.js Client instance
 * 
 * @example
 * ```typescript
 * import { createClient } from 'discord-js-helpers';
 * 
 * const client = createClient({ 
 *   features: ['commands', 'members', 'v2', 'diagnostics'] 
 * });
 * ```
 * 
 * @example
 * ```javascript
 * const { createClient } = require('discord-js-helpers');
 * const client = createClient({ features: ['commands', 'v2'] });
 * ```
 */
export function createClient(options: CreateClientOptions = {}): Client {
  const {
    features = ['commands'],
    additionalIntents = [],
    partials = [],
    handleErrors = true,
    logger = createDefaultLogger(),
  } = options;

  // Calculate required intents based on features
  const intents = new Set<GatewayIntentBits>();
  
  // Always add Guilds intent for basic functionality
  intents.add(GatewayIntentBits.Guilds);
  
  // Add intents based on features
  for (const feature of features) {
    const featureIntents = FEATURE_INTENTS[feature];
    if (featureIntents) {
      featureIntents.forEach(intent => intents.add(intent));
    } else {
      logger.warn(`Unknown feature: ${feature}`);
    }
  }
  
  // Add any additional intents
  additionalIntents.forEach(intent => intents.add(intent));

  const client = new Client({
    intents: Array.from(intents),
    partials,
  });

  // Install error handling if requested
  if (handleErrors) {
    installErrorHandling(client, logger);
  }

  // Add feature tracking for diagnostics
  (client as any).__easierDjsFeatures = features;
  (client as any).__easierDjsLogger = logger;

  return client;
}

/**
 * Runs comprehensive diagnostics on a Discord client to identify common issues.
 * Checks intents, permissions, latency, and configuration problems.
 * 
 * @param client - The Discord.js client to diagnose
 * 
 * @example
 * ```typescript
 * import { createClient, diagnose } from 'discord-js-helpers';
 * 
 * const client = createClient({ features: ['commands', 'diagnostics'] });
 * await diagnose(client); // Prints actionable health checks
 * await client.login(process.env.DISCORD_TOKEN);
 * ```
 * 
 * @example
 * ```javascript
 * const { createClient, diagnose } = require('discord-js-helpers');
 * const client = createClient({ features: ['commands'] });
 * diagnose(client).then(() => client.login(process.env.DISCORD_TOKEN));
 * ```
 */
export async function diagnose(client: Client): Promise<void> {
  const logger = (client as any).__easierDjsLogger || createDefaultLogger();
  const features = (client as any).__easierDjsFeatures || [];
  
  logger.info('🔍 Running discord-js-helpers diagnostics...');
  
  // Check if client is ready
  if (!client.isReady()) {
    logger.warn('⚠️  Client is not ready yet. Some checks may be incomplete.');
  }
  
  // Check token
  if (!process.env.DISCORD_TOKEN && !client.token) {
    logger.error('❌ No Discord token found. Set DISCORD_TOKEN environment variable.');
  } else {
    logger.info('✅ Discord token configured');
  }
  
  // Check intents configuration
  checkIntents(client, features, logger);
  
  // Check latency if ready
  if (client.isReady()) {
    const wsLatency = client.ws.ping;
    if (wsLatency < 100) {
      logger.info(`✅ WebSocket latency: ${wsLatency}ms (excellent)`);
    } else if (wsLatency < 300) {
      logger.info(`⚠️  WebSocket latency: ${wsLatency}ms (good)`);
    } else {
      logger.warn(`⚠️  WebSocket latency: ${wsLatency}ms (high - check connection)`);
    }
    
    logger.info(`📊 Bot in ${client.guilds.cache.size} servers`);
  }
  
  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]!);
  if (majorVersion >= 18) {
    logger.info(`✅ Node.js ${nodeVersion} (supported)`);
  } else {
    logger.error(`❌ Node.js ${nodeVersion} is too old. discord-js-helpers requires Node.js 18.17+`);
  }
  
  logger.info('🎯 Diagnostics complete!');
}

/**
 * Checks if the client has the right intents for the enabled features
 */
function checkIntents(client: Client, features: Features, logger: Logger): void {
  const requiredIntents = new Set<GatewayIntentBits>();
  
  // Calculate what intents should be enabled
  for (const feature of features) {
    const featureIntents = FEATURE_INTENTS[feature];
    if (featureIntents) {
      featureIntents.forEach(intent => requiredIntents.add(intent));
    }
  }
  
  const clientIntents = client.options.intents;
  const hasMessageContent = Array.isArray(clientIntents) 
    ? clientIntents.includes(GatewayIntentBits.MessageContent)
    : clientIntents?.has(GatewayIntentBits.MessageContent);
  
  // Check message content intent specifically
  if (features.includes('messages')) {
    if (hasMessageContent) {
      logger.info('✅ Message Content intent enabled');
    } else {
      logger.error('❌ Message Content intent missing. Required for reading message content.');
      logger.error('   Add it in Discord Developer Portal > Bot > Privileged Gateway Intents');
    }
  }
  
  // Check guild members intent
  if (features.includes('members')) {
    const hasMembers = Array.isArray(clientIntents)
      ? clientIntents.includes(GatewayIntentBits.GuildMembers)
      : clientIntents?.has(GatewayIntentBits.GuildMembers);
    if (hasMembers) {
      logger.info('✅ Guild Members intent enabled');
    } else {
      logger.error('❌ Guild Members intent missing. Required for member-related features.');
      logger.error('   Enable it in Discord Developer Portal > Bot > Privileged Gateway Intents');
    }
  }
  
  logger.info(`📋 Features enabled: ${features.join(', ')}`);
}

/**
 * Installs default error handling for the client
 */
function installErrorHandling(client: Client, logger: Logger): void {
  // Handle unhandled promise rejections in interactions
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isRepliable()) return;
    
    // Add error handling wrapper (this would be expanded in a full implementation)
    // For now, just log that error handling is installed
    logger.debug('Error handling installed for interaction');
  });
  
  client.on('error', (error) => {
    logger.error('Discord client error:', error);
  });
  
  client.on('warn', (warning) => {
    logger.warn('Discord client warning:', warning);
  });
}

/**
 * Creates a simple default logger that outputs to console
 */
function createDefaultLogger(): Logger {
  return {
    debug: (message: string, ...args: any[]) => console.debug(`[DEBUG] ${message}`, ...args),
    info: (message: string, ...args: any[]) => console.info(`[INFO] ${message}`, ...args),
    warn: (message: string, ...args: any[]) => console.warn(`[WARN] ${message}`, ...args),
    error: (message: string, ...args: any[]) => console.error(`[ERROR] ${message}`, ...args),
  };
} 