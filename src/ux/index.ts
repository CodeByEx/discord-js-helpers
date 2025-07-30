import { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ComponentType,
  MessageComponentInteraction,
  Message,
  MessageFlags,
  InteractionResponse,
  ChatInputCommandInteraction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction
} from 'discord.js';
import type { Interaction } from 'discord.js';
import { card, btn } from '../v2/index.js';
import type { CardBuilder } from '../v2/index.js';

/**
 * Configuration options for confirm dialogs
 */
export interface ConfirmOptions {
  /** Custom ID for the yes button */
  yesId?: string;
  /** Custom ID for the no button */
  noId?: string;
  /** Timeout in milliseconds (default: 30000) */
  timeoutMs?: number;
  /** Whether the response should be ephemeral */
  ephemeral?: boolean;
  /** Custom UI builder function */
  ui?: (base: ReturnType<typeof card>) => ReturnType<typeof card>;
}

/**
 * Configuration options for pagination
 */
export interface PaginateOptions {
  /** Items per page (default: 10) */
  perPage?: number;
  /** Timeout in milliseconds (default: 300000 / 5 minutes) */
  timeoutMs?: number;
  /** Whether the response should be ephemeral */
  ephemeral?: boolean;
  /** Custom render function for each page */
  render?: (items: string[], page: number, totalPages: number) => ReturnType<typeof card>;
}

/**
 * Configuration options for component collectors
 */
export interface CollectOptions {
  /** Filter function for interactions */
  filter?: (i: MessageComponentInteraction) => boolean;
  /** Collection timeout in milliseconds */
  time?: number;
  /** Maximum interactions to collect */
  max?: number;
}

/**
 * Shows a confirmation dialog with Yes/No buttons.
 * Handles timeout gracefully and provides clear user feedback.
 * 
 * @param interaction - The interaction to respond to
 * @param text - The confirmation message text
 * @param options - Configuration options
 * @returns Promise resolving to true if confirmed, false if denied or timed out
 * 
 * @example
 * ```typescript
 * import { confirm } from 'easier-djs';
 * 
 * if (await confirm(interaction, "Delete this channel?")) {
 *   // User confirmed, proceed with deletion
 *   await interaction.channel?.delete();
 * }
 * ```
 * 
 * @example
 * ```javascript
 * const { confirm } = require('easier-djs');
 * 
 * const confirmed = await confirm(interaction, "Are you sure?", {
 *   ephemeral: true,
 *   timeoutMs: 15000
 * });
 * ```
 */
export async function confirm(
  interaction: ChatInputCommandInteraction | ButtonInteraction,
  text: string,
  options: ConfirmOptions = {}
): Promise<boolean> {
  const {
    yesId = 'confirm_yes',
    noId = 'confirm_no',
    timeoutMs = 30000,
    ephemeral = false,
    ui = (base) => base
  } = options;

  // Build the confirmation UI
  const baseCard = card().section(`⚠️ **Confirmation Required**\n\n${text}`);
  const confirmCard = ui(baseCard);
  
  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    btn.danger(yesId, 'Yes'),
    btn.secondary(noId, 'No')
  );

  const response = confirmCard.withActions(actionRow);
  response.flags = response.flags | (ephemeral ? MessageFlags.Ephemeral : 0);

  // Send the confirmation message
  let message: Message;
  if (interaction.replied || interaction.deferred) {
    const reply = await interaction.editReply(response);
    message = reply as Message;
  } else {
    const reply = await interaction.reply({ ...response, fetchReply: true });
    message = reply as Message;
  }

  try {
    // Wait for user response
    const buttonInteraction = await message.awaitMessageComponent({
      filter: (i: MessageComponentInteraction) => [yesId, noId].includes(i.customId) && i.user.id === interaction.user.id,
      time: timeoutMs,
      componentType: ComponentType.Button
    });

    const confirmed = buttonInteraction.customId === yesId;
    
    // Update the message to show the result
    const resultCard = card().section(
      confirmed 
        ? '✅ **Confirmed**\nAction will proceed.'
        : '❌ **Cancelled**\nNo action taken.'
    );

    await buttonInteraction.update(resultCard.withActions());
    
    return confirmed;
  } catch (error) {
    // Timeout occurred
    const timeoutCard = card().section('⏰ **Timed out**\nNo response received.');
    
    try {
      await interaction.editReply(timeoutCard.withActions());
    } catch {
      // Ignore edit errors (interaction might be expired)
    }
    
    return false;
  }
}

/**
 * Creates a paginated interface for large lists of items.
 * Automatically handles navigation and provides a clean interface.
 * 
 * @param interaction - The interaction to respond to
 * @param items - Array of items to paginate
 * @param options - Configuration options
 * 
 * @example
 * ```typescript
 * import { paginate } from 'easier-djs';
 * 
 * const userList = guild.members.cache.map(m => m.user.tag);
 * await paginate(interaction, userList, { 
 *   perPage: 10,
 *   ephemeral: true 
 * });
 * ```
 * 
 * @example
 * ```javascript
 * const { paginate } = require('easier-djs');
 * 
 * await paginate(interaction, items, {
 *   perPage: 5,
 *   render: (items, page) => card().section(`Page ${page}\n${items.join('\n')}`)
 * });
 * ```
 */
export async function paginate(
  interaction: ChatInputCommandInteraction | ButtonInteraction,
  items: string[],
  options: PaginateOptions = {}
): Promise<void> {
  const {
    perPage = 10,
    timeoutMs = 300000, // 5 minutes
    ephemeral = false,
    render = defaultPaginateRender
  } = options;

  if (items.length === 0) {
    const emptyCard = card().section('📭 **No items to display**');
    const response = emptyCard.withActions();
    response.flags = response.flags | (ephemeral ? MessageFlags.Ephemeral : 0);
    
    await interaction.reply(response);
    return;
  }

  const totalPages = Math.ceil(items.length / perPage);
  let currentPage = 0;

  const updatePage = async (pageIndex: number, targetInteraction: any) => {
    const startIndex = pageIndex * perPage;
    const endIndex = Math.min(startIndex + perPage, items.length);
    const pageItems = items.slice(startIndex, endIndex);
    
    const pageCard = render(pageItems, pageIndex + 1, totalPages);
    
    const actionRow = new ActionRowBuilder<ButtonBuilder>();
    
    // Add navigation buttons
    if (totalPages > 1) {
      actionRow.addComponents(
        btn.secondary('page_first', '⏮️').setDisabled(pageIndex === 0),
        btn.secondary('page_prev', '⬅️').setDisabled(pageIndex === 0),
        btn.secondary('page_next', '➡️').setDisabled(pageIndex === totalPages - 1),
        btn.secondary('page_last', '⏭️').setDisabled(pageIndex === totalPages - 1)
      );
    }
    
    const response = pageCard.withActions(actionRow);
    response.flags = response.flags | (ephemeral ? MessageFlags.Ephemeral : 0);
    
    return await targetInteraction.update ? 
      targetInteraction.update(response) : 
      targetInteraction.reply({ ...response, fetchReply: true });
  };

  // Send initial page
  let message: Message;
  if (interaction.replied || interaction.deferred) {
    message = await updatePage(currentPage, { update: interaction.editReply.bind(interaction) });
  } else {
    message = await updatePage(currentPage, interaction) as Message;
  }

  if (totalPages <= 1) return; // No pagination needed

  // Handle navigation
  const collector = message.createMessageComponentCollector({
    filter: (i: MessageComponentInteraction) => i.user.id === interaction.user.id,
    time: timeoutMs,
    componentType: ComponentType.Button
  });

  collector.on('collect', async (buttonInteraction: MessageComponentInteraction) => {
    switch (buttonInteraction.customId) {
      case 'page_first':
        currentPage = 0;
        break;
      case 'page_prev':
        currentPage = Math.max(0, currentPage - 1);
        break;
      case 'page_next':
        currentPage = Math.min(totalPages - 1, currentPage + 1);
        break;
      case 'page_last':
        currentPage = totalPages - 1;
        break;
    }
    
    await updatePage(currentPage, buttonInteraction);
  });

  collector.on('end', async () => {
    // Disable all buttons on timeout
    try {
      const timeoutCard = render(
        items.slice(currentPage * perPage, Math.min((currentPage + 1) * perPage, items.length)),
        currentPage + 1,
        totalPages
      );
      
      await interaction.editReply(timeoutCard.withActions());
    } catch {
      // Ignore edit errors
    }
  });
}

/**
 * Collects button interactions from a message for a specified time.
 * 
 * @param message - The message to collect interactions from
 * @param options - Collection options
 * @returns Promise resolving to array of collected interactions
 * 
 * @example
 * ```typescript
 * import { collectButtons } from 'easier-djs';
 * 
 * const interactions = await collectButtons(message, {
 *   filter: (i) => i.user.id === interaction.user.id,
 *   time: 60000,
 *   max: 1
 * });
 * ```
 */
export async function collectButtons(
  message: Message,
  options: CollectOptions = {}
): Promise<MessageComponentInteraction[]> {
  const {
    filter = () => true,
    time = 30000,
    max = 1
  } = options;

  return new Promise((resolve) => {
    const collected: MessageComponentInteraction[] = [];
    
    const collector = message.createMessageComponentCollector({
      filter,
      time,
      max,
      componentType: ComponentType.Button
    });

    collector.on('collect', (interaction: MessageComponentInteraction) => {
      collected.push(interaction);
    });

    collector.on('end', () => {
      resolve(collected);
    });
  });
}

/**
 * Default render function for pagination
 */
function defaultPaginateRender(items: string[], page: number, totalPages: number): ReturnType<typeof card> {
  const content = items.join('\n') || 'No items on this page';
  return card()
    .section(`📄 **Page ${page} of ${totalPages}**\n\n${content}`)
    .footer(`${items.length} items on this page`);
} 