import { ActionRowBuilder, MessageFlags } from 'discord.js';

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

  color(_hex: number): this {
    this.cardColor = _hex;
    return this;
  }

  section(_md: string): this {
    this.sections.push(_md);
    return this;
  }

  thumb(_url: string): this {
    this.thumbUrl = _url;
    return this;
  }

  image(_url: string): this {
    this.imageUrl = _url;
    return this;
  }

  footer(_md: string): this {
    this.footerText = _md;
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