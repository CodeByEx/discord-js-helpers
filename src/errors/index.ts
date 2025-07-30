import type { Client } from 'discord.js';
import type { Logger } from '../types/index.js';

/**
 * Base error class for discord-js-simplified errors
 */
export class EasierError extends Error {
  public code?: string;
  public cause?: unknown;
  
  constructor(message: string, code?: string, cause?: unknown) {
    super(message);
    this.name = 'EasierError';
    if (code !== undefined) {
      this.code = code;
    }
    this.cause = cause;
  }
}

/**
 * Error thrown when command validation fails
 */
export class CommandValidationError extends EasierError {
  constructor(message: string, cause?: unknown) {
    super(message, 'COMMAND_VALIDATION_ERROR', cause);
    this.name = 'CommandValidationError';
  }
}

/**
 * Error thrown when permissions are insufficient
 */
export class PermissionError extends EasierError {
  constructor(message: string, cause?: unknown) {
    super(message, 'PERMISSION_ERROR', cause);
    this.name = 'PermissionError';
  }
}

/**
 * Error thrown when rate limits are exceeded
 */
export class RateLimitError extends EasierError {
  constructor(message: string, retryAfter?: number, cause?: unknown) {
    super(message, 'RATE_LIMIT_ERROR', cause);
    this.name = 'RateLimitError';
    if (retryAfter !== undefined) {
      (this as { retryAfter?: number }).retryAfter = retryAfter;
    }
  }
}

/**
 * Installs default error handling middleware for Discord interactions.
 * Catches unhandled errors and provides user-friendly error messages.
 * 
 * @param client - Discord.js client to install error handling on
 * @param logger - Optional logger for error reporting
 * 
 * @example
 * ```typescript
 * import { installInteractionErrorHandler } from 'discord-js-simplified';
 * 
 * installInteractionErrorHandler(client, logger);
 * ```
 * 
 * @example
 * ```javascript
 * const { installInteractionErrorHandler } = require('discord-js-simplified');
 * installInteractionErrorHandler(client);
 * ```
 */
export function installInteractionErrorHandler(client: Client, logger?: Logger): void {
  const log = logger || createDefaultLogger();
  
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isRepliable()) return;
    
    // Store original methods to wrap them
    const originalReply = interaction.reply.bind(interaction);
    const originalFollowUp = interaction.followUp.bind(interaction);
    const originalEditReply = interaction.editReply.bind(interaction);
    
    // Wrap reply methods with error handling
    interaction.reply = wrapWithErrorHandling(originalReply, interaction, log);
    interaction.followUp = wrapWithErrorHandling(originalFollowUp, interaction, log);
    interaction.editReply = wrapWithErrorHandling(originalEditReply, interaction, log);
  });
  
  // Handle uncaught errors
  client.on('error', (error) => {
    log.error('Discord client error:', error);
  });
  
  client.on('warn', (warning) => {
    log.warn('Discord client warning:', warning);
  });
  
  log.info('✅ Interaction error handler installed');
}

/**
 * Wraps an interaction method with error handling
 */
function wrapWithErrorHandling(originalMethod: Function, interaction: unknown, logger: Logger) {
  return async (...args: unknown[]) => {
    try {
      return await originalMethod(...args);
    } catch (error) {
      await handleInteractionError(error, interaction, logger);
      throw error; // Re-throw for upstream handling
    }
  };
}

/**
 * Handles errors that occur during interaction processing
 */
async function handleInteractionError(error: unknown, interaction: unknown, logger: Logger): Promise<void> {
  // Redact sensitive information from error logs
  const redactedError = redactSensitiveInfo(error);
  const interactionObj = interaction as Record<string, unknown>;
  const userId = interactionObj.user && typeof interactionObj.user === 'object' && interactionObj.user !== null
    ? (interactionObj.user as Record<string, unknown>).id
    : 'unknown';
  logger.error(`Interaction error for user ${userId}:`, redactedError);
  
  let userMessage = 'Something went wrong while processing your request.';
  
  if (error instanceof EasierError) {
    switch (error.code) {
    case 'PERMISSION_ERROR':
      userMessage = 'You don\'t have permission to use this command.';
      break;
    case 'RATE_LIMIT_ERROR':
      userMessage = 'You\'re doing that too fast. Please try again later.';
      break;
    case 'COMMAND_VALIDATION_ERROR':
      userMessage = 'Invalid command input. Please check your parameters.';
      break;
    }
  }
  
  try {
    const interactionObj = interaction as Record<string, unknown>;
    if (interactionObj.replied || interactionObj.deferred) {
      await (interactionObj.editReply as Function)({ content: userMessage, ephemeral: true });
    } else {
      await (interactionObj.reply as Function)({ content: userMessage, ephemeral: true });
    }
  } catch (replyError) {
    logger.error('Failed to send error message to user:', replyError);
  }
}

/**
 * Redacts sensitive information from error objects and stack traces
 */
function redactSensitiveInfo(error: unknown): unknown {
  if (error instanceof Error) {
    const redactedError = { ...error };
    
    // Redact common sensitive patterns
    if (redactedError.message) {
      redactedError.message = redactedError.message
        .replace(/Bot\s+[A-Za-z0-9._-]{59}/g, 'Bot [REDACTED]')
        .replace(/Bearer\s+[A-Za-z0-9._-]+/g, 'Bearer [REDACTED]')
        .replace(/\d{17,19}/g, '[SNOWFLAKE_REDACTED]'); // Discord snowflakes
    }
    
    if (redactedError.stack) {
      redactedError.stack = redactedError.stack
        .replace(/Bot\s+[A-Za-z0-9._-]{59}/g, 'Bot [REDACTED]')
        .replace(/Bearer\s+[A-Za-z0-9._-]+/g, 'Bearer [REDACTED]')
        .replace(/\d{17,19}/g, '[SNOWFLAKE_REDACTED]');
    }
    
    return redactedError;
  }
  
  return error;
}

/**
 * Creates a logger with redaction capabilities
 * 
 * @param options - Logger configuration
 * @returns Logger instance with built-in redaction
 * 
 * @example
 * ```typescript
 * import { createLogger } from 'discord-js-simplified';
 * 
 * const logger = createLogger({ 
 *   level: 'info',
 *   redact: ['password', 'token', 'secret']
 * });
 * ```
 */
export function createLogger(options: {
  level?: 'debug' | 'info' | 'warn' | 'error';
  redact?: string[];
} = {}): Logger {
  const { level = 'info', redact = ['token', 'password', 'secret', 'key'] } = options;
  
  const levels = ['debug', 'info', 'warn', 'error'];
  const currentLevelIndex = levels.indexOf(level);
  
  const shouldLog = (messageLevel: string) => {
    return levels.indexOf(messageLevel) >= currentLevelIndex;
  };
  
  const redactMessage = (message: string, ...args: unknown[]) => {
    let redactedMessage = message;
    const redactedArgs = args.map(arg => {
      if (typeof arg === 'string') {
        let redacted = arg;
        redact.forEach(pattern => {
          const regex = new RegExp(pattern, 'gi');
          redacted = redacted.replace(regex, '[REDACTED]');
        });
        return redacted;
      }
      return arg;
    });
    
    redact.forEach(pattern => {
      const regex = new RegExp(pattern, 'gi');
      redactedMessage = redactedMessage.replace(regex, '[REDACTED]');
    });
    
    return { message: redactedMessage, args: redactedArgs };
  };
  
  return {
    debug: (message: string, ...args: unknown[]) => {
      if (shouldLog('debug')) {
        const { message: msg, args: redactedArgs } = redactMessage(message, ...args);
        console.debug(`[DEBUG] ${msg}`, ...redactedArgs);
      }
    },
    info: (message: string, ...args: unknown[]) => {
      if (shouldLog('info')) {
        const { message: msg, args: redactedArgs } = redactMessage(message, ...args);
        console.info(`[INFO] ${msg}`, ...redactedArgs);
      }
    },
    warn: (message: string, ...args: unknown[]) => {
      if (shouldLog('warn')) {
        const { message: msg, args: redactedArgs } = redactMessage(message, ...args);
        console.warn(`[WARN] ${msg}`, ...redactedArgs);
      }
    },
    error: (message: string, ...args: unknown[]) => {
      if (shouldLog('error')) {
        const { message: msg, args: redactedArgs } = redactMessage(message, ...args);
        console.error(`[ERROR] ${msg}`, ...redactedArgs);
      }
    },
  };
}

/**
 * Creates a simple default logger
 */
function createDefaultLogger(): Logger {
  return {
    debug: (message: string, ...args: unknown[]) => console.debug(`[DEBUG] ${message}`, ...args),
    info: (message: string, ...args: unknown[]) => console.info(`[INFO] ${message}`, ...args),
    warn: (message: string, ...args: unknown[]) => console.warn(`[WARN] ${message}`, ...args),
    error: (message: string, ...args: unknown[]) => console.error(`[ERROR] ${message}`, ...args),
  };
} 