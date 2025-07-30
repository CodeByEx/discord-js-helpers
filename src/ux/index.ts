import { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ComponentType,
  MessageComponentInteraction,
  Message,
  MessageFlags,
  ChatInputCommandInteraction,
  ButtonInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js';
import { msg, btn } from '../v2/index.js';

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
  ui?: (_base: ReturnType<typeof msg>) => ReturnType<typeof msg>;
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
  render?: (_items: string[], _page: number, _totalPages: number) => ReturnType<typeof msg>;
}

/**
 * Configuration options for component collectors
 */
export interface CollectOptions {
  /** Filter function for interactions */
  filter?: (_i: MessageComponentInteraction) => boolean;
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
 * import { confirm } from 'discord-js-helpers';
 * 
 * if (await confirm(interaction, "Delete this channel?")) {
 *   // User confirmed, proceed with deletion
 *   await interaction.channel?.delete();
 * }
 * ```
 * 
 * @example
 * ```javascript
 * const { confirm } = require('discord-js-helpers');
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
  const baseCard = msg().text(`⚠️ **Confirmation Required**\n\n${text}`);
  const confirmCard = ui(baseCard);
  
  // const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
  //   btn.danger(yesId, 'Yes'),
  //   btn.secondary(noId, 'No')
  // );

  const response = confirmCard.buttons(btn.danger(yesId, 'Yes'), btn.secondary(noId, 'No')).build();
  const flags = response.flags | (ephemeral ? MessageFlags.Ephemeral : 0);

  // Send the confirmation message
  let message: Message;
  if (interaction.replied || interaction.deferred) {
    const reply = await interaction.editReply({ components: response.components, flags });
    message = reply as Message;
  } else {
    const reply = await interaction.reply({ components: response.components, flags, fetchReply: true });
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
    const resultCard = msg().text(
      confirmed 
        ? '✅ **Confirmed**\nAction will proceed.'
        : '❌ **Cancelled**\nNo action taken.'
    );

    const resultResponse = resultCard.build();
    await buttonInteraction.update({ components: resultResponse.components });
    
    return confirmed;
  } catch {
    // Timeout occurred
    const timeoutCard = msg().text('⏰ **Timed out**\nNo response received.');
    
    try {
      const timeoutResponse = timeoutCard.build();
      await interaction.editReply({ components: timeoutResponse.components });
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
 * import { paginate } from 'discord-js-helpers';
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
 * const { paginate } = require('discord-js-helpers');
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
    const emptyCard = msg().text('📭 **No items to display**');
    const response = emptyCard.build();
    response.flags = response.flags | (ephemeral ? MessageFlags.Ephemeral : 0);
    
    const responseData = response;
    await interaction.reply({ components: responseData.components, flags: responseData.flags as number });
    return;
  }

  const totalPages = Math.ceil(items.length / perPage);
  let currentPage = 0;

  const updatePage = async (pageIndex: number, targetInteraction: { update?: Function; reply?: Function }) => {
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
    
    const response = pageCard.buttons(...actionRow.components).build();
    response.flags = response.flags | (ephemeral ? MessageFlags.Ephemeral : 0);
    
    return await targetInteraction.update ? 
      (targetInteraction.update as Function)(response) : 
      (targetInteraction.reply as Function)({ ...response, fetchReply: true });
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
      
      const timeoutResponse = timeoutCard.buttons().build();
      await interaction.editReply({ components: timeoutResponse.components });
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
 * import { collectButtons } from 'discord-js-helpers';
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
function defaultPaginateRender(items: string[], page: number, totalPages: number): ReturnType<typeof msg> {
  const content = items.join('\n') || 'No items on this page';
  return msg()
    .text(`📄 **Page ${page} of ${totalPages}**\n\n${content}`)
    .footer(`${items.length} items on this page`);
}

/**
 * Field definition for modal forms
 */
export interface ModalField {
  /** Unique identifier for the field */
  id: string;
  /** Display label for the field */
  label: string;
  /** Input style - short or paragraph */
  style?: 'short' | 'paragraph';
  /** Whether the field is required */
  required?: boolean;
  /** Maximum character length */
  maxLength?: number;
  /** Placeholder text */
  placeholder?: string;
  /** Default value */
  value?: string;
}

/**
 * Creates a modal builder with predefined fields.
 * Simplifies modal creation with a schema-first approach.
 * 
 * @param id - Modal custom ID
 * @param title - Modal title
 * @param fields - Array of field definitions
 * @returns ModalBuilder instance
 * 
 * @example
 * ```typescript
 * import { modal } from 'discord-js-helpers';
 * 
 * const form = modal('report', 'Report User', [
 *   { id: 'user', label: 'User ID', required: true },
 *   { id: 'reason', label: 'Reason', style: 'paragraph', maxLength: 1000 }
 * ]);
 * 
 * await interaction.showModal(form);
 * ```
 */
export function modal(id: string, title: string, fields: ModalField[]): ModalBuilder {
  const modal = new ModalBuilder()
    .setCustomId(id)
    .setTitle(title);

  const actionRows: ActionRowBuilder<TextInputBuilder>[] = [];

  for (const field of fields) {
    const input = new TextInputBuilder()
      .setCustomId(field.id)
      .setLabel(field.label)
      .setStyle(field.style === 'paragraph' ? TextInputStyle.Paragraph : TextInputStyle.Short)
      .setRequired(field.required ?? false);

    if (field.maxLength) {
      input.setMaxLength(field.maxLength);
    }

    if (field.placeholder) {
      input.setPlaceholder(field.placeholder);
    }

    if (field.value) {
      input.setValue(field.value);
    }

    const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(input);
    actionRows.push(actionRow);
  }

  return modal.addComponents(actionRows);
}

/**
 * Waits for a modal submission and returns parsed data.
 * Handles timeout and provides type-safe field access.
 * 
 * @param interaction - Command interaction to show modal on
 * @param modal - Modal builder to show
 * @param timeoutMs - Timeout in milliseconds (default: 300000 / 5 minutes)
 * @returns Promise resolving to parsed modal data
 * 
 * @example
 * ```typescript
 * import { modal, awaitModal } from 'discord-js-helpers';
 * 
 * const form = modal('report', 'Report User', [
 *   { id: 'user', label: 'User ID', required: true },
 *   { id: 'reason', label: 'Reason', style: 'paragraph' }
 * ]);
 * 
 * const data = await awaitModal(interaction, form);
 * await interaction.followUp(`Reported ${data.user} for: ${data.reason}`);
 * ```
 */
export async function awaitModal(
  interaction: ChatInputCommandInteraction,
  modal: ModalBuilder,
  timeoutMs: number = 300000
): Promise<Record<string, string>> {
  await interaction.showModal(modal);

  try {
    const modalInteraction = await interaction.awaitModalSubmit({
      filter: (i) => i.customId === modal.data.custom_id && i.user.id === interaction.user.id,
      time: timeoutMs
    });

    const data: Record<string, string> = {};
    
    for (const component of modalInteraction.components) {
      if (component.components[0]?.type === ComponentType.TextInput) {
        const input = component.components[0];
        data[input.customId] = input.value;
      }
    }

    return data;
  } catch {
    throw new Error('Modal submission timed out or was cancelled');
  }
} 