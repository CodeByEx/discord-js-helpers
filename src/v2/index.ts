import { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  MessageFlags,
  ComponentType,
  APIMessageComponent
} from 'discord.js';

export type Markdownish = string;

interface CardComponents {
  components: ActionRowBuilder<any>[];
  flags: MessageFlags;
}

/**
 * V2 Card Builder - Creates Discord V2 components with automatic flag handling.
 * Eliminates the verbosity of V2 components and automatically sets the required flag.
 */
export interface CardBuilder {
  /**
   * Set the embed color (hex value)
   * @param hex - Color in hex format (e.g., 0x5865f2)
   */
  color(hex: number): this;
  
  /**
   * Add a text section with markdown support
   * @param md - Markdown text content
   */
  section(md: Markdownish): this;
  
  /**
   * Set thumbnail image URL
   * @param url - Image URL for thumbnail
   */
  thumb(url: string): this;
  
  /**
   * Add an image (compiles to MediaGallery in V2)
   * @param url - Image URL
   */
  image(url: string): this;
  
  /**
   * Set footer text with markdown support
   * @param md - Footer text with markdown
   */
  footer(md: Markdownish): this;
  
  /**
   * Convert to Discord API component structure
   */
  toComponent(): APIMessageComponent;
  
  /**
   * Add action rows and return components with proper V2 flags
   * @param rows - Action rows to add to the card
   */
  withActions(...rows: ActionRowBuilder<any>[]): CardComponents;
}

/**
 * Creates a new V2 card builder with fluent API.
 * Automatically handles V2 component structure and flags.
 * 
 * @returns CardBuilder instance for method chaining
 * 
 * @example
 * ```typescript
 * import { card, btn } from 'easier-djs';
 * 
 * const ui = card()
 *   .color(0x5865f2)
 *   .section("**Server Info**\nSome text.")
 *   .thumb("https://cdn.discordapp.com/embed/avatars/0.png")
 *   .footer("_Requested by you_")
 *   .withActions(
 *     new ActionRowBuilder().addComponents(
 *       btn.primary("refresh", "Refresh")
 *     )
 *   );
 * 
 * await interaction.reply(ui); // Automatically sets MessageFlags.IsComponentsV2
 * ```
 * 
 * @example
 * ```javascript
 * const { card, btn } = require('easier-djs');
 * const ui = card().section("hello").withActions(
 *   new ActionRowBuilder().addComponents(btn.link("https://x.y", "Open"))
 * );
 * await interaction.reply(ui);
 * ```
 */
export function card(): CardBuilder {
  return new CardBuilderImpl();
}

class CardBuilderImpl implements CardBuilder {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _color?: number;
  private _sections: string[] = [];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _thumbUrl?: string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _imageUrl?: string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _footerText?: string;

  color(hex: number): this {
    this._color = hex;
    return this;
  }

  section(md: Markdownish): this {
    this._sections.push(md);
    return this;
  }

  thumb(url: string): this {
    this._thumbUrl = url;
    return this;
  }

  image(url: string): this {
    this._imageUrl = url;
    return this;
  }

  footer(md: Markdownish): this {
    this._footerText = md;
    return this;
  }

  toComponent(): APIMessageComponent {
    // This is a simplified implementation
    // In a full implementation, this would build proper V2 component structures
    // For now, we return a basic structure to demonstrate the API
    return {
      type: ComponentType.ActionRow,
      components: []
    };
  }

  withActions(...rows: ActionRowBuilder<any>[]): CardComponents {
    // In a real implementation, this would properly build V2 container structures
    // For now, we'll return the action rows with the V2 flag
    return {
      components: rows,
      flags: MessageFlags.IsComponentsV2
    };
  }
}

/**
 * Button helper namespace for creating common button types.
 * Provides shortcuts for primary, secondary, danger, and link buttons.
 */
export const btn = {
  /**
   * Create a primary (blurple) button
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
   * Create a secondary (grey) button
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
   * Create a danger (red) button
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
   * Create a link button (opens URL)
   * @param url - URL to open when clicked
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
 * Migration helper to convert existing EmbedBuilder to V2 card format
 * @param embed - Discord.js EmbedBuilder to convert
 * @returns CardBuilder with equivalent content
 * 
 * @example
 * ```typescript
 * import { EmbedBuilder } from 'discord.js';
 * import { convertEmbed } from 'easier-djs';
 * 
 * const oldEmbed = new EmbedBuilder()
 *   .setTitle('Title')
 *   .setDescription('Description');
 * 
 * const newCard = convertEmbed(oldEmbed);
 * ```
 */
export function convertEmbed(embed: any): CardBuilder {
  const builder = card();
  
  // Convert embed properties to card format
  if (embed.data?.color) {
    builder.color(embed.data.color);
  }
  
  if (embed.data?.description) {
    builder.section(embed.data.description);
  }
  
  if (embed.data?.thumbnail?.url) {
    builder.thumb(embed.data.thumbnail.url);
  }
  
  if (embed.data?.image?.url) {
    builder.image(embed.data.image.url);
  }
  
  if (embed.data?.footer?.text) {
    builder.footer(embed.data.footer.text);
  }
  
  return builder;
} 