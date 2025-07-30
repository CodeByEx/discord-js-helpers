import { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  MessageFlags,
  APIMessageComponent,
  TextInputBuilder,
  TextInputStyle,
  SelectMenuBuilder,
  ModalBuilder,
  TextDisplayBuilder,
  ContainerBuilder,
  ChannelSelectMenuBuilder,
  RoleSelectMenuBuilder,
  UserSelectMenuBuilder,
  MentionableSelectMenuBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} from 'discord.js';

export type Markdownish = string;

/**
 * Simple message builder that mimics v1 message creation
 * but uses Components v2 under the hood
 * 
 * @example
 * ```typescript
 * const message = msg()
 *   .title('Welcome!')
 *   .text('This is a simple message with **markdown** support.')
 *   .separator()
 *   .field('Status', 'Online', true)
 *   .buttons(btn.primary('action', 'Click me'))
 *   .build();
 * 
 * await interaction.reply(message);
 * ```
 */
export interface SimpleMessage {
  /**
   * Add text content with markdown support
   * @param content - The text content to add
   * @returns The message builder for chaining
   */
  text(content: string): this;
  
  /**
   * Add a title (bold text)
   * @param text - The title text
   * @returns The message builder for chaining
   */
  title(text: string): this;
  
  /**
   * Add a subtitle (italic text)
   * @param text - The subtitle text
   * @returns The message builder for chaining
   */
  subtitle(text: string): this;
  
  /**
   * Add a separator line
   * @returns The message builder for chaining
   */
  separator(): this;
  
  /**
   * Add a small separator
   * @returns The message builder for chaining
   */
  smallSeparator(): this;
  
  /**
   * Add an image (as text with URL)
   * @param url - The image URL
   * @param alt - Optional alt text for the image
   * @returns The message builder for chaining
   */
  image(url: string, alt?: string): this;
  
  /**
   * Add multiple images (as text with URLs)
   * @param urls - Array of image URLs
   * @returns The message builder for chaining
   */
  images(urls: string[]): this;
  
  /**
   * Add a media gallery
   * @param urls - Array of media URLs
   * @returns The message builder for chaining
   */
  mediaGallery(urls: string[]): this;
  
  /**
   * Add a thumbnail
   * @param url - The thumbnail URL
   * @param alt - Optional alt text for the thumbnail
   * @returns The message builder for chaining
   */
  thumbnail(url: string, alt?: string): this;
  
  /**
   * Add a field (name: value format)
   * @param name - The field name
   * @param value - The field value
   * @param inline - Whether the field should be inline
   * @returns The message builder for chaining
   */
  field(name: string, value: string, inline?: boolean): this;
  
  /**
   * Set the color theme (affects visual styling)
   * @param hex - The color hex value
   * @returns The message builder for chaining
   */
  color(hex: number): this;
  
  /**
   * Add a footer
   * @param text - The footer text
   * @returns The message builder for chaining
   */
  footer(text: string): this;
  
  /**
   * Add buttons
   * @param buttons - The buttons to add
   * @returns The message builder for chaining
   */
  buttons(...buttons: ButtonBuilder[]): this;
  
  /**
   * Add a select menu
   * @param menu - The select menu to add
   * @returns The message builder for chaining
   */
  select(menu: SelectMenuBuilder | StringSelectMenuBuilder | UserSelectMenuBuilder | RoleSelectMenuBuilder | ChannelSelectMenuBuilder | MentionableSelectMenuBuilder): this;
  
  /**
   * Build the final message for Discord.js
   * @returns The built message components and flags
   */
  build(): {
    components: APIMessageComponent[];
    flags: MessageFlags;
  };
  
  /**
   * Build for interaction reply
   * @returns The built message components and flags
   */
  reply(): {
    components: APIMessageComponent[];
    flags: MessageFlags;
  };
}

/**
 * Simple embed builder that mimics v1 embed creation
 * but uses Components v2 under the hood
 * 
 * @example
 * ```typescript
 * const embed = embed()
 *   .title('Server Information')
 *   .description('Details about the server')
 *   .color(0x5865f2)
 *   .field('Members', '1000', true)
 *   .field('Channels', '50', true)
 *   .footer('Requested by user')
 *   .buttons(btn.success('join', 'Join Server'))
 *   .build();
 * 
 * await interaction.reply(embed);
 * ```
 */
export interface SimpleEmbed {
  /**
   * Set the title
   * @param text - The title text
   * @returns The embed builder for chaining
   */
  title(text: string): this;
  
  /**
   * Set the description
   * @param text - The description text
   * @returns The embed builder for chaining
   */
  description(text: string): this;
  
  /**
   * Set the color
   * @param hex - The color hex value
   * @returns The embed builder for chaining
   */
  color(hex: number): this;
  
  /**
   * Add a field
   * @param name - The field name
   * @param value - The field value
   * @param inline - Whether the field should be inline
   * @returns The embed builder for chaining
   */
  field(name: string, value: string, inline?: boolean): this;
  
  /**
   * Set thumbnail
   * @param url - The thumbnail URL
   * @returns The embed builder for chaining
   */
  thumbnail(url: string): this;
  
  /**
   * Set main image
   * @param url - The image URL
   * @returns The embed builder for chaining
   */
  image(url: string): this;
  
  /**
   * Set footer
   * @param text - The footer text
   * @returns The embed builder for chaining
   */
  footer(text: string): this;
  
  /**
   * Set timestamp
   * @param date - The timestamp date (defaults to current time)
   * @returns The embed builder for chaining
   */
  timestamp(date?: Date): this;
  
  /**
   * Add buttons
   * @param buttons - The buttons to add
   * @returns The embed builder for chaining
   */
  buttons(...buttons: ButtonBuilder[]): this;
  
  /**
   * Add a select menu
   * @param menu - The select menu to add
   * @returns The embed builder for chaining
   */
  select(menu: SelectMenuBuilder | StringSelectMenuBuilder | UserSelectMenuBuilder | RoleSelectMenuBuilder | ChannelSelectMenuBuilder | MentionableSelectMenuBuilder): this;
  
  /**
   * Build the final embed for Discord.js
   * @returns The built embed components and flags
   */
  build(): {
    components: APIMessageComponent[];
    flags: MessageFlags;
  };
}

/**
 * Options for pagination helper
 */
export interface PaginationOptions {
  /** Array of items to paginate */
  items: unknown[];
  /** Number of items per page */
  itemsPerPage: number;
  /** Current page number (defaults to 1) */
  currentPage?: number;
  /** Whether to show page information (defaults to true) */
  showPageInfo?: boolean;
  /** Whether to show navigation buttons (defaults to true) */
  showNavigation?: boolean;
}

/**
 * Form field configuration for modals
 */
export interface FormField {
  /** Unique identifier for the field */
  id: string;
  /** Display label for the field */
  label: string;
  /** Optional placeholder text */
  placeholder?: string;
  /** Whether the field is required (defaults to true) */
  required?: boolean;
  /** Input style (short or paragraph) */
  style?: TextInputStyle;
  /** Minimum length for the input */
  minLength?: number;
  /** Maximum length for the input */
  maxLength?: number;
  /** Default value for the field */
  value?: string;
}

/**
 * Modal builder with enhanced features
 */
export interface ModalBuilderV2 {
  /**
   * Create a simple modal with text inputs
   * @param id - Custom ID for the modal
   * @param title - Modal title
   * @param inputs - Array of form field configurations
   * @returns ModalBuilder instance
   */
  create(id: string, title: string, inputs: FormField[]): ModalBuilder;
  
  /**
   * Create a contact form modal
   * @param id - Custom ID for the modal
   * @returns ModalBuilder instance with contact form fields
   */
  contact(id: string): ModalBuilder;
  
  /**
   * Create a feedback form modal
   * @param id - Custom ID for the modal
   * @returns ModalBuilder instance with feedback form fields
   */
  feedback(id: string): ModalBuilder;
  
  /**
   * Create a settings form modal
   * @param id - Custom ID for the modal
   * @param fields - Array of field names to generate inputs for
   * @returns ModalBuilder instance with settings form fields
   */
  settings(id: string, fields: string[]): ModalBuilder;
}

/**
 * Create a simple message builder
 * 
 * @example
 * ```typescript
 * const message = msg()
 *   .title('Welcome!')
 *   .text('This is a simple message.')
 *   .buttons(btn.primary('click', 'Click me'))
 *   .build();
 * ```
 * 
 * @returns A new SimpleMessage instance
 */
export function msg(): SimpleMessage {
  return new SimpleMessageImpl();
}

/**
 * Create a simple embed builder
 * 
 * @example
 * ```typescript
 * const embed = embed()
 *   .title('Server Info')
 *   .description('Information about the server')
 *   .color(0x5865f2)
 *   .build();
 * ```
 * 
 * @returns A new SimpleEmbed instance
 */
export function embed(): SimpleEmbed {
  return new SimpleEmbedImpl();
}

/**
 * Enhanced modal builder with predefined forms
 * 
 * @example
 * ```typescript
 * // Contact form
 * const contactModal = modalV2.contact('contact_form');
 * await interaction.showModal(contactModal);
 * 
 * // Custom form
 * const customModal = modalV2.create('custom', 'Form', [
 *   { id: 'name', label: 'Name', required: true },
 *   { id: 'email', label: 'Email', required: true }
 * ]);
 * ```
 */
export const modalV2: ModalBuilderV2 = {
  create(id: string, title: string, inputs: FormField[]): ModalBuilder {
    const modal = new ModalBuilder()
      .setCustomId(id)
      .setTitle(title);

    inputs.forEach(input => {
      const textInput = new TextInputBuilder()
        .setCustomId(input.id)
        .setLabel(input.label)
        .setStyle(input.style || TextInputStyle.Short)
        .setRequired(input.required !== false);

      if (input.placeholder) {
        textInput.setPlaceholder(input.placeholder);
      }

      if (input.minLength !== undefined) {
        textInput.setMinLength(input.minLength);
      }

      if (input.maxLength !== undefined) {
        textInput.setMaxLength(input.maxLength);
      }

      if (input.value) {
        textInput.setValue(input.value);
      }

      const actionRow = new ActionRowBuilder<TextInputBuilder>()
        .addComponents(textInput);

      modal.addComponents(actionRow);
    });

    return modal;
  },

  contact(id: string): ModalBuilder {
    return this.create(id, 'Contact Form', [
      { id: 'name', label: 'Name', placeholder: 'Enter your name', required: true },
      { id: 'email', label: 'Email', placeholder: 'Enter your email', required: true },
      { id: 'subject', label: 'Subject', placeholder: 'What is this about?', required: true },
      { id: 'message', label: 'Message', placeholder: 'Tell us more...', required: true, style: TextInputStyle.Paragraph }
    ]);
  },

  feedback(id: string): ModalBuilder {
    return this.create(id, 'Feedback Form', [
      { id: 'rating', label: 'Rating (1-10)', placeholder: 'Rate your experience', required: true },
      { id: 'feedback', label: 'Feedback', placeholder: 'Share your thoughts...', required: true, style: TextInputStyle.Paragraph },
      { id: 'suggestions', label: 'Suggestions', placeholder: 'Any suggestions for improvement?', style: TextInputStyle.Paragraph }
    ]);
  },

  settings(id: string, fields: string[]): ModalBuilder {
    const inputs: FormField[] = fields.map(field => ({
      id: field.toLowerCase().replace(/\s+/g, '_'),
      label: field,
      placeholder: `Enter ${field.toLowerCase()}`,
      required: true
    }));

    return this.create(id, 'Settings', inputs);
  }
};

/**
 * Create a paginated message for large datasets
 * 
 * @example
 * ```typescript
 * const items = Array.from({ length: 100 }, (_, i) => ({
 *   title: `Item ${i + 1}`,
 *   description: `Description for item ${i + 1}`
 * }));
 * 
 * const pagination = createPagination({
 *   items,
 *   itemsPerPage: 5,
 *   currentPage: 1,
 *   showPageInfo: true,
 *   showNavigation: true
 * });
 * 
 * await interaction.reply(pagination);
 * ```
 * 
 * @param options - Pagination configuration options
 * @returns Built message with pagination components
 */
export function createPagination(options: PaginationOptions) {
  const { items, itemsPerPage, currentPage = 1, showPageInfo = true, showNavigation = true } = options;
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = items.slice(startIndex, endIndex);

  const message = msg();
  
  // Add page info
  if (showPageInfo) {
    message.text(`**Page ${currentPage} of ${totalPages}**`);
    message.text(`Showing ${startIndex + 1}-${Math.min(endIndex, items.length)} of ${items.length} items`);
    message.separator();
  }

  // Add items
  currentItems.forEach((item, index) => {
    if (typeof item === 'string') {
      message.text(item);
    } else if (typeof item === 'object' && item !== null && 'title' in item && 'description' in item) {
      const itemObj = item as Record<string, unknown>;
      message.title(itemObj.title as string);
      message.text(itemObj.description as string);
    } else {
      message.text(JSON.stringify(item));
    }
  });

  // Add navigation buttons
  if (showNavigation && totalPages > 1) {
    const buttons: ButtonBuilder[] = [];
    
    if (currentPage > 1) {
      buttons.push(btn.primary('page_first', '⏮️ First'));
      buttons.push(btn.secondary('page_prev', '◀️ Previous'));
    }
    
    if (currentPage < totalPages) {
      buttons.push(btn.secondary('page_next', 'Next ▶️'));
      buttons.push(btn.primary('page_last', 'Last ⏭️'));
    }
    
    if (buttons.length > 0) {
      message.buttons(...buttons);
    }
  }

  return message.build();
}

/**
 * Create a custom form modal
 * 
 * @example
 * ```typescript
 * const form = createForm([
 *   { id: 'name', label: 'Name', required: true },
 *   { id: 'email', label: 'Email', required: true },
 *   { id: 'message', label: 'Message', style: 2, required: false }
 * ]);
 * 
 * await interaction.showModal(form);
 * ```
 * 
 * @param fields - Array of form field configurations
 * @returns ModalBuilder instance with the specified fields
 */
export function createForm(fields: FormField[]) {
  return modalV2.create('form_' + Date.now(), 'Form', fields);
}

class SimpleMessageImpl implements SimpleMessage {
  private textComponents: string[] = [];
  private actionComponents: APIMessageComponent[] = [];
  private messageColor?: number;
  private hasContent = false;

  text(content: string): this {
    this.textComponents.push(content);
    this.hasContent = true;
    return this;
  }

  title(text: string): this {
    this.textComponents.push(`**${text}**`);
    this.hasContent = true;
    return this;
  }

  subtitle(text: string): this {
    this.textComponents.push(`*${text}*`);
    this.hasContent = true;
    return this;
  }

  separator(): this {
    this.textComponents.push('---');
    return this;
  }

  smallSeparator(): this {
    this.textComponents.push('---');
    return this;
  }

  image(url: string, alt?: string): this {
    this.textComponents.push(`![${alt || 'Image'}](${url})`);
    return this;
  }

  images(urls: string[]): this {
    const imageText = urls.map(url => `![Image](${url})`).join('\n');
    this.textComponents.push(imageText);
    return this;
  }

  mediaGallery(urls: string[]): this {
    // For now, use text representation since MediaGalleryBuilder might not be available
    const galleryText = urls.map(url => `![Gallery Image](${url})`).join('\n');
    this.textComponents.push(galleryText);
    return this;
  }

  thumbnail(url: string, alt?: string): this {
    this.textComponents.push(`![${alt || 'Thumbnail'}](${url})`);
    return this;
  }

  field(name: string, value: string, inline = false): this {
    const fieldText = inline 
      ? `**${name}** ${value}`
      : `**${name}**\n${value}`;
    
    this.textComponents.push(fieldText);
    this.hasContent = true;
    return this;
  }

  color(hex: number): this {
    this.messageColor = hex;
    return this;
  }

  footer(text: string): this {
    this.textComponents.push(`*${text}*`);
    this.hasContent = true;
    return this;
  }

  buttons(...buttons: ButtonBuilder[]): this {
    const row = new ActionRowBuilder<ButtonBuilder>();
    buttons.forEach(button => row.addComponents(button));
    this.actionComponents.push(row.toJSON());
    return this;
  }

  select(menu: SelectMenuBuilder | StringSelectMenuBuilder | UserSelectMenuBuilder | RoleSelectMenuBuilder | ChannelSelectMenuBuilder | MentionableSelectMenuBuilder): this {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = new ActionRowBuilder<any>();
    row.addComponents(menu);
    this.actionComponents.push(row.toJSON());
    return this;
  }

  build(): { components: APIMessageComponent[]; flags: MessageFlags } {
    const components: APIMessageComponent[] = [];

    // If no content was added, add a default text component
    if (!this.hasContent) {
      this.textComponents.unshift(' ');
    }

    // Create a container with all text content
    if (this.textComponents.length > 0) {
      const container = new ContainerBuilder();
      this.textComponents.forEach(text => {
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(text)
        );
      });
      components.push(container.toJSON());
    }

    // Add action components
    components.push(...this.actionComponents);

    return {
      components,
      flags: MessageFlags.IsComponentsV2
    };
  }

  reply(): { components: APIMessageComponent[]; flags: MessageFlags } {
    return this.build();
  }
}

class SimpleEmbedImpl implements SimpleEmbed {
  private textComponents: string[] = [];
  private actionComponents: APIMessageComponent[] = [];
  private embedColor?: number;
  private embedTitle?: string;
  private embedDescription?: string;
  private fields: Array<{ name: string; value: string; inline: boolean }> = [];
  private embedThumbnail?: string;
  private embedImage?: string;
  private embedFooter?: string;
  private embedTimestamp?: Date;

  title(text: string): this {
    this.embedTitle = text;
    return this;
  }

  description(text: string): this {
    this.embedDescription = text;
    return this;
  }

  color(hex: number): this {
    this.embedColor = hex;
    return this;
  }

  field(name: string, value: string, inline = false): this {
    this.fields.push({ name, value, inline });
    return this;
  }

  thumbnail(url: string): this {
    this.embedThumbnail = url;
    return this;
  }

  image(url: string): this {
    this.embedImage = url;
    return this;
  }

  footer(text: string): this {
    this.embedFooter = text;
    return this;
  }

  timestamp(date?: Date): this {
    this.embedTimestamp = date || new Date();
    return this;
  }

  buttons(...buttons: ButtonBuilder[]): this {
    const row = new ActionRowBuilder<ButtonBuilder>();
    buttons.forEach(button => row.addComponents(button));
    this.actionComponents.push(row.toJSON());
    return this;
  }

  select(menu: SelectMenuBuilder | StringSelectMenuBuilder | UserSelectMenuBuilder | RoleSelectMenuBuilder | ChannelSelectMenuBuilder | MentionableSelectMenuBuilder): this {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = new ActionRowBuilder<any>();
    row.addComponents(menu);
    this.actionComponents.push(row.toJSON());
    return this;
  }

  build(): { components: APIMessageComponent[]; flags: MessageFlags } {
    const components: APIMessageComponent[] = [];

    // Create container for embed content
    const container = new ContainerBuilder();
    
    // Add title
    if (this.embedTitle) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**${this.embedTitle}**`)
      );
    }

    // Add description
    if (this.embedDescription) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(this.embedDescription)
      );
    }

    // Add fields
    if (this.fields.length > 0) {
      this.fields.forEach(field => {
        const fieldText = field.inline 
          ? `**${field.name}** ${field.value}`
          : `**${field.name}**\n${field.value}`;
        
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(fieldText)
        );
      });
    }

    // Add footer
    if (this.embedFooter) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`*${this.embedFooter}*`)
      );
    }

    // Add timestamp
    if (this.embedTimestamp) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`<t:${Math.floor(this.embedTimestamp.getTime() / 1000)}:R>`)
      );
    }

    components.push(container.toJSON());

    // Add thumbnail if specified (as text since ImageDisplayBuilder isn't available)
    if (this.embedThumbnail) {
      const thumbContainer = new ContainerBuilder();
      thumbContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`![Thumbnail](${this.embedThumbnail})`)
      );
      components.push(thumbContainer.toJSON());
    }

    // Add main image if specified (as text since ImageDisplayBuilder isn't available)
    if (this.embedImage) {
      const imageContainer = new ContainerBuilder();
      imageContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`![Embed image](${this.embedImage})`)
      );
      components.push(imageContainer.toJSON());
    }

    // Add action components
    components.push(...this.actionComponents);

    return {
      components,
      flags: MessageFlags.IsComponentsV2
    };
  }
}

/**
 * Button helper namespace for creating Discord.js buttons
 * 
 * @example
 * ```typescript
 * const button = btn.primary('action', 'Click me');
 * const dangerButton = btn.danger('delete', 'Delete');
 * const linkButton = btn.link('https://discord.js.org', 'Visit Discord.js');
 * ```
 */
export const btn = {
  /**
   * Create a primary button
   * @param id - Custom ID for the button
   * @param label - Button label text
   * @returns ButtonBuilder configured as primary style
   */
  primary(id: string, label: string): ButtonBuilder {
    return new ButtonBuilder()
      .setCustomId(id)
      .setLabel(label)
      .setStyle(ButtonStyle.Primary);
  },

  /**
   * Create a secondary button
   * @param id - Custom ID for the button
   * @param label - Button label text
   * @returns ButtonBuilder configured as secondary style
   */
  secondary(id: string, label: string): ButtonBuilder {
    return new ButtonBuilder()
      .setCustomId(id)
      .setLabel(label)
      .setStyle(ButtonStyle.Secondary);
  },

  /**
   * Create a danger button
   * @param id - Custom ID for the button
   * @param label - Button label text
   * @returns ButtonBuilder configured as danger style
   */
  danger(id: string, label: string): ButtonBuilder {
    return new ButtonBuilder()
      .setCustomId(id)
      .setLabel(label)
      .setStyle(ButtonStyle.Danger);
  },

  /**
   * Create a success button
   * @param id - Custom ID for the button
   * @param label - Button label text
   * @returns ButtonBuilder configured as success style
   */
  success(id: string, label: string): ButtonBuilder {
    return new ButtonBuilder()
      .setCustomId(id)
      .setLabel(label)
      .setStyle(ButtonStyle.Success);
  },

  /**
   * Create a link button
   * @param url - URL for the button to link to
   * @param label - Button label text
   * @returns ButtonBuilder configured as link style
   */
  link(url: string, label: string): ButtonBuilder {
    return new ButtonBuilder()
      .setURL(url)
      .setLabel(label)
      .setStyle(ButtonStyle.Link);
  }
};

/**
 * Select menu helper namespace for creating Discord.js select menus
 * 
 * @example
 * ```typescript
 * const stringMenu = select.string('choice', 'Select an option', [
 *   { label: 'Option 1', value: 'opt1', description: 'First option' },
 *   { label: 'Option 2', value: 'opt2', description: 'Second option' }
 * ]);
 * 
 * const userMenu = select.user('user_select', 'Select a user');
 * const roleMenu = select.role('role_select', 'Select a role');
 * ```
 */
export const select = {
  /**
   * Create a string select menu
   * @param id - Custom ID for the menu
   * @param placeholder - Placeholder text
   * @param options - Array of options with label, value, and optional description
   * @returns StringSelectMenuBuilder
   */
  string(id: string, placeholder: string, options: Array<{ label: string; value: string; description?: string }>): StringSelectMenuBuilder {
    const menu = new StringSelectMenuBuilder()
      .setCustomId(id)
      .setPlaceholder(placeholder);

    options.forEach(option => {
      const menuOption = new StringSelectMenuOptionBuilder()
        .setLabel(option.label)
        .setValue(option.value);
      
      if (option.description) {
        menuOption.setDescription(option.description);
      }
      
      menu.addOptions(menuOption);
    });

    return menu;
  },

  /**
   * Create a user select menu
   * @param id - Custom ID for the menu
   * @param placeholder - Placeholder text
   * @returns UserSelectMenuBuilder
   */
  user(id: string, placeholder: string): UserSelectMenuBuilder {
    return new UserSelectMenuBuilder()
      .setCustomId(id)
      .setPlaceholder(placeholder);
  },

  /**
   * Create a role select menu
   * @param id - Custom ID for the menu
   * @param placeholder - Placeholder text
   * @returns RoleSelectMenuBuilder
   */
  role(id: string, placeholder: string): RoleSelectMenuBuilder {
    return new RoleSelectMenuBuilder()
      .setCustomId(id)
      .setPlaceholder(placeholder);
  },

  /**
   * Create a channel select menu
   * @param id - Custom ID for the menu
   * @param placeholder - Placeholder text
   * @returns ChannelSelectMenuBuilder
   */
  channel(id: string, placeholder: string): ChannelSelectMenuBuilder {
    return new ChannelSelectMenuBuilder()
      .setCustomId(id)
      .setPlaceholder(placeholder);
  }
};

/**
 * Migration helper to convert existing EmbedBuilder to v2 format
 * 
 * @example
 * ```typescript
 * import { EmbedBuilder } from 'discord.js';
 * import { convertEmbed } from 'discord-js-simplified';
 * 
 * const oldEmbed = new EmbedBuilder()
 *   .setTitle('Title')
 *   .setDescription('Description');
 * 
 * const newEmbed = convertEmbed(oldEmbed);
 * await interaction.reply(newEmbed.build());
 * ```
 * 
 * @param embed - Discord.js EmbedBuilder to convert
 * @returns SimpleEmbed with equivalent content
 */
export function convertEmbed(embed: unknown): SimpleEmbed {
  const embedObj = embed as Record<string, unknown>;
  const builder = (embedObj as unknown as () => SimpleEmbed)();
  
  // Convert embed properties to embed format
  const data = embedObj.data as Record<string, unknown> | undefined;
  if (data?.color) {
    builder.color(data.color as number);
  }
  
  if (data?.title) {
    builder.title(data.title as string);
  }
  
  if (data?.description) {
    builder.description(data.description as string);
  }
  
  // Convert embed fields to embed fields
  if (data?.fields && Array.isArray(data.fields)) {
    for (const field of data.fields as Array<Record<string, unknown>>) {
      builder.field(field.name as string, field.value as string, field.inline as boolean);
    }
  }
  
  if (data?.thumbnail && typeof data.thumbnail === 'object' && data.thumbnail !== null) {
    const thumbnail = data.thumbnail as Record<string, unknown>;
    if (thumbnail.url) {
      builder.thumbnail(thumbnail.url as string);
    }
  }
  
  if (data?.image && typeof data.image === 'object' && data.image !== null) {
    const image = data.image as Record<string, unknown>;
    if (image.url) {
      builder.image(image.url as string);
    }
  }
  
  if (data?.footer && typeof data.footer === 'object' && data.footer !== null) {
    const footer = data.footer as Record<string, unknown>;
    if (footer.text) {
      builder.footer(footer.text as string);
    }
  }
  
  if (data?.timestamp) {
    builder.timestamp(new Date(data.timestamp as string | number));
  }
  
  return builder;
}

/**
 * Migrate a collection of embeds to v2 format
 * 
 * @example
 * ```typescript
 * const oldEmbeds = [embed1, embed2, embed3];
 * const newEmbeds = migrateEmbeds(oldEmbeds).map(e => e.build());
 * ```
 * 
 * @param embeds - Array of EmbedBuilder instances
 * @returns Array of SimpleEmbed instances
 */
export function migrateEmbeds(embeds: unknown[]): SimpleEmbed[] {
  return embeds.map(embed => convertEmbed(embed));
}

/**
 * Check if a message contains v1 embeds that need migration
 * 
 * @example
 * ```typescript
 * if (needsMigration(message)) {
 *   const newEmbeds = migrateMessage(message);
 *   await interaction.reply(newEmbeds[0].build());
 * }
 * ```
 * 
 * @param message - Discord message object
 * @returns True if message contains embeds that should be migrated
 */
export function needsMigration(message: unknown): boolean {
  const messageObj = message as Record<string, unknown>;
  return Array.isArray(messageObj.embeds) && messageObj.embeds.length > 0;
}

/**
 * Migrate a message with v1 embeds to v2 format
 * 
 * @example
 * ```typescript
 * const newEmbeds = migrateMessage(message);
 * for (const embed of newEmbeds) {
 *   await interaction.followUp(embed.build());
 * }
 * ```
 * 
 * @param message - Discord message object with embeds
 * @returns Array of SimpleEmbed instances
 */
export function migrateMessage(message: unknown): SimpleEmbed[] {
  if (!needsMigration(message)) {
    return [];
  }
  
  const messageObj = message as Record<string, unknown>;
  const embeds = messageObj.embeds as Array<unknown>;
  return migrateEmbeds(embeds);
}

// Legacy exports for backward compatibility
// export { card } from './legacy.js'; 