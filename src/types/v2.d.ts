/**
 * TypeScript declarations for Discord.js Helpers V2 Components
 */

import { 
  ButtonBuilder, 
  SelectMenuBuilder, 
  StringSelectMenuBuilder, 
  UserSelectMenuBuilder, 
  RoleSelectMenuBuilder, 
  ChannelSelectMenuBuilder, 
  MentionableSelectMenuBuilder,
  ModalBuilder,
  TextInputStyle,
  APIMessageComponent,
  MessageFlags
} from 'discord.js';

export type Markdownish = string;

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
 * Simple message builder that mimics v1 message creation
 * but uses Components v2 under the hood
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
 * Button helper namespace for creating Discord.js buttons
 */
export interface ButtonHelpers {
  /**
   * Create a primary button
   * @param id - Custom ID for the button
   * @param label - Button label text
   * @returns ButtonBuilder configured as primary style
   */
  primary(id: string, label: string): ButtonBuilder;
  
  /**
   * Create a secondary button
   * @param id - Custom ID for the button
   * @param label - Button label text
   * @returns ButtonBuilder configured as secondary style
   */
  secondary(id: string, label: string): ButtonBuilder;
  
  /**
   * Create a danger button
   * @param id - Custom ID for the button
   * @param label - Button label text
   * @returns ButtonBuilder configured as danger style
   */
  danger(id: string, label: string): ButtonBuilder;
  
  /**
   * Create a success button
   * @param id - Custom ID for the button
   * @param label - Button label text
   * @returns ButtonBuilder configured as success style
   */
  success(id: string, label: string): ButtonBuilder;
  
  /**
   * Create a link button
   * @param url - URL for the button to link to
   * @param label - Button label text
   * @returns ButtonBuilder configured as link style
   */
  link(url: string, label: string): ButtonBuilder;
}

/**
 * Select menu helper namespace for creating Discord.js select menus
 */
export interface SelectHelpers {
  /**
   * Create a string select menu
   * @param id - Custom ID for the menu
   * @param placeholder - Placeholder text
   * @param options - Array of options with label, value, and optional description
   * @returns StringSelectMenuBuilder
   */
  string(id: string, placeholder: string, options: Array<{ label: string; value: string; description?: string }>): StringSelectMenuBuilder;
  
  /**
   * Create a user select menu
   * @param id - Custom ID for the menu
   * @param placeholder - Placeholder text
   * @returns UserSelectMenuBuilder
   */
  user(id: string, placeholder: string): UserSelectMenuBuilder;
  
  /**
   * Create a role select menu
   * @param id - Custom ID for the menu
   * @param placeholder - Placeholder text
   * @returns RoleSelectMenuBuilder
   */
  role(id: string, placeholder: string): RoleSelectMenuBuilder;
  
  /**
   * Create a channel select menu
   * @param id - Custom ID for the menu
   * @param placeholder - Placeholder text
   * @returns ChannelSelectMenuBuilder
   */
  channel(id: string, placeholder: string): ChannelSelectMenuBuilder;
}

// Factory function declarations
export declare function msg(): SimpleMessage;
export declare function embed(): SimpleEmbed;
export declare function createPagination(options: PaginationOptions): { components: APIMessageComponent[]; flags: MessageFlags };
export declare function createForm(fields: FormField[]): ModalBuilder;

// Namespace declarations
export declare const modalV2: ModalBuilderV2;
export declare const btn: ButtonHelpers;
export declare const select: SelectHelpers;

// Migration function declarations
export declare function convertEmbed(embed: unknown): SimpleEmbed;
export declare function migrateEmbeds(embeds: unknown[]): SimpleEmbed[];
export declare function needsMigration(message: unknown): boolean;
export declare function migrateMessage(message: unknown): SimpleEmbed[]; 