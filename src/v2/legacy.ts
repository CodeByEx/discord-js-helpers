import { ActionRowBuilder, ButtonBuilder, MessageFlags } from 'discord.js';

/**
 * Legacy card builder for backward compatibility
 * @deprecated Use msg() or embed() instead
 */
export interface CardBuilder {
  color(hex: number): this;
  section(md: string): this;
  thumb(url: string): this;
  image(url: string): this;
  footer(md: string): this;
  withActions(...rows: ActionRowBuilder<any>[]): {
    components: ActionRowBuilder<any>[];
    flags: MessageFlags;
  };
}

/**
 * Legacy card function for backward compatibility
 * @deprecated Use msg() or embed() instead
 */
export function card(): CardBuilder {
  return new LegacyCardBuilder();
}

class LegacyCardBuilder implements CardBuilder {
  private cardColor?: number;
  private sections: string[] = [];
  private thumbUrl?: string;
  private imageUrl?: string;
  private footerText?: string;

  color(hex: number): this {
    this.cardColor = hex;
    return this;
  }

  section(md: string): this {
    this.sections.push(md);
    return this;
  }

  thumb(url: string): this {
    this.thumbUrl = url;
    return this;
  }

  image(url: string): this {
    this.imageUrl = url;
    return this;
  }

  footer(md: string): this {
    this.footerText = md;
    return this;
  }

  withActions(...rows: ActionRowBuilder<any>[]): {
    components: ActionRowBuilder<any>[];
    flags: MessageFlags;
  } {
    return {
      components: rows,
      flags: MessageFlags.IsComponentsV2
    };
  }
} 