# djs-helper-kit

> Discord.js helpers with zero configuration

Drop friction: fewer foot-guns (intents, permissions, rate limits, V2 flags).  
Fast to ship: one-liners for deploy, pagination, confirm flows, and V2 components.  
Type-safe but JS-friendly: first-class TS types + good JSDoc for JS.  
Composable: small helpers; no framework lock-in; tree-shakable.  
Production-ready: retry/backoff, sharding helpers, diagnostics, error middleware.

## Quick Start

### TypeScript

```typescript
import { createClient, deploy, msg, btn, createCommandHandler } from 'djs-helper-kit';
import { SlashCommandBuilder } from 'discord.js';

const client = createClient({ features: ['commands', 'v2'] });

const commands = [
  {
    data: new SlashCommandBuilder().setName('ping').setDescription('Pong!'),
    async run(interaction) {
      const ui = msg()
        .text('🏓 Pong!')
        .footer('Bot latency check')
        .buttons(btn.primary('refresh', 'Refresh'))
        .build();
      
      await interaction.reply(ui);
    }
  }
];

client.on('interactionCreate', createCommandHandler(commands));

await deploy(client, commands, { scope: 'guild' });
await client.login(process.env.DISCORD_TOKEN);
```

### JavaScript

```javascript
import { createClient, deploy, msg, btn, createCommandHandler } from 'djs-helper-kit';
import { SlashCommandBuilder } from 'discord.js';

const client = createClient({ features: ['commands', 'v2'] });

const commands = [
  {
    data: new SlashCommandBuilder().setName('ping').setDescription('Pong!'),
    async run(interaction) {
      const ui = msg()
        .text('🏓 Pong!')
        .footer('Bot latency check')
        .buttons(btn.primary('refresh', 'Refresh'))
        .build();
      
      await interaction.reply(ui);
    }
  }
];

client.on('interactionCreate', createCommandHandler(commands));

await deploy(client, commands, { scope: 'guild' });
await client.login(process.env.DISCORD_TOKEN);
```

## V2 Components

Create rich, interactive messages with Discord Components v2 using a simple, v1-like API:

```typescript
// Simple message with text and buttons
const message = msg()
  .title('Welcome!')
  .text('This is a simple message with **markdown** support.')
  .separator()
  .field('Status', 'Online', true)
  .buttons(
    btn.primary('action', 'Click me'),
    btn.secondary('help', 'Help'),
    btn.danger('delete', 'Delete')
  )
  .build();

// Embed-like structure
const embed = embed()
  .title('Server Information')
  .description('Details about the server')
  .color(0x5865f2)
  .field('Members', '1000', true)
  .field('Channels', '50', true)
  .footer('Requested by user')
  .buttons(btn.success('join', 'Join Server'))
  .build();
```

## Enhanced Features

### Modal Support

Create complex forms with predefined templates:

```typescript
import { modalV2 } from 'djs-helper-kit';

// Contact form
const contactModal = modalV2.contact('contact_form');

// Feedback form
const feedbackModal = modalV2.feedback('feedback_form');

// Custom form
const customModal = modalV2.create('custom_form', 'Custom Form', [
  { id: 'name', label: 'Name', placeholder: 'Enter your name', required: true },
  { id: 'age', label: 'Age', placeholder: 'Enter your age', required: true },
  { id: 'bio', label: 'Bio', placeholder: 'Tell us about yourself', style: 2, required: false }
]);

// Settings form
const settingsModal = modalV2.settings('settings_form', [
  'Username',
  'Email', 
  'Timezone',
  'Language'
]);

await interaction.showModal(contactModal);
```

### Pagination Helpers

Handle large datasets with built-in pagination:

```typescript
import { createPagination } from 'djs-helper-kit';

const items = Array.from({ length: 100 }, (_, i) => ({
  title: `Item ${i + 1}`,
  description: `Description for item ${i + 1}`
}));

const pagination = createPagination({
  items,
  itemsPerPage: 5,
  currentPage: 1,
  showPageInfo: true,
  showNavigation: true
});

await interaction.reply(pagination);
```

### Media Galleries & Thumbnails

Add rich media content to your messages:

```typescript
const message = msg()
  .title('🖼️ Photo Gallery')
  .text('Check out these images:')
  .mediaGallery([
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg',
    'https://example.com/image3.jpg'
  ])
  .separator()
  .text('With thumbnail:')
  .thumbnail('https://example.com/thumb.jpg', 'Sample thumbnail')
  .text('This message has a thumbnail accessory')
  .build();
```

### Form Builders

Create complex forms with validation:

```typescript
import { createForm } from 'djs-helper-kit';

const form = createForm([
  { 
    id: 'name', 
    label: 'Name', 
    placeholder: 'Enter your name', 
    required: true,
    minLength: 2,
    maxLength: 50
  },
  { 
    id: 'email', 
    label: 'Email', 
    placeholder: 'Enter your email', 
    required: true 
  },
  { 
    id: 'message', 
    label: 'Message', 
    placeholder: 'Tell us more...', 
    required: true,
    style: 2 // Paragraph style
  }
]);

await interaction.showModal(form);
```

## API Reference

### Core Functions

#### `msg() / embed()`

Fluent builders for creating V2 components:

```typescript
msg()
  .text(content: string)           // Add text content
  .title(text: string)             // Add bold title
  .subtitle(text: string)          // Add italic subtitle
  .separator()                     // Add separator line
  .smallSeparator()                // Add small separator
  .image(url: string, alt?: string) // Add image
  .images(urls: string[])          // Add multiple images
  .mediaGallery(urls: string[])    // Add media gallery
  .thumbnail(url: string, alt?: string) // Add thumbnail
  .field(name: string, value: string, inline?: boolean) // Add field
  .color(hex: number)              // Set color theme
  .footer(text: string)            // Add footer
  .buttons(...buttons: ButtonBuilder[]) // Add buttons
  .select(menu: SelectMenuBuilder) // Add select menu
  .build()                         // Build for Discord.js
```

#### `btn` namespace

```typescript
btn.primary(id: string, label: string)    // Primary button
btn.secondary(id: string, label: string)  // Secondary button
btn.danger(id: string, label: string)     // Danger button
btn.success(id: string, label: string)    // Success button
btn.link(url: string, label: string)      // Link button
```

#### `select` namespace

```typescript
select.string(id: string, placeholder: string, options: Array<{label: string, value: string, description?: string}>)
select.user(id: string, placeholder: string)
select.role(id: string, placeholder: string)
select.channel(id: string, placeholder: string)
```

#### `modalV2` namespace

```typescript
modalV2.create(id: string, title: string, inputs: FormField[]) // Custom modal
modalV2.contact(id: string)                                     // Contact form
modalV2.feedback(id: string)                                    // Feedback form
modalV2.settings(id: string, fields: string[])                 // Settings form
```

#### Pagination & Forms

```typescript
createPagination(options: PaginationOptions) // Create paginated message
createForm(fields: FormField[])              // Create custom form
```

### Migration Tools

Convert existing v1 embeds to v2 format:

```typescript
import { convertEmbed, migrateEmbeds } from 'djs-helper-kit';

// Convert single embed
const oldEmbed = new EmbedBuilder()
  .setTitle('Title')
  .setDescription('Description');

const newEmbed = convertEmbed(oldEmbed).build();

// Convert multiple embeds
const oldEmbeds = [embed1, embed2, embed3];
const newEmbeds = migrateEmbeds(oldEmbeds).map(e => e.build());
```

## Migration Note

If you were using the old `card()` API, here's how to migrate:

**Old:**
```typescript
const ui = card()
  .section('Content')
  .withActions(btn.primary('test', 'Test'))
```

**New:**
```typescript
const ui = msg()
  .text('Content')
  .buttons(btn.primary('test', 'Test'))
  .build()
```

## Project Structure

```
src/
├── client/          # Client creation & configuration
├── commands/        # Command handling & deployment
├── v2/             # V2 components (msg(), embed(), buttons, selects, modals)
├── ux/             # UX primitives (confirm, paginate)
├── rest/           # REST API helpers
├── perms/          # Permission utilities
├── shards/         # Sharding helpers
├── cache/          # Caching utilities
├── i18n/           # Internationalization
├── errors/         # Error handling
├── logging/        # Logging utilities
└── types/          # Shared TypeScript types
```

## Examples

See the `examples/` directory for complete bot implementations:

- `examples/ts/minimal-bot.ts` - Minimal bot with basic commands
- `examples/ts/advanced-bot.ts` - Advanced bot with complex features
- `examples/ts/v0.3-features.ts` - V2 components demo
- `examples/ts/enhanced-features.ts` - Enhanced features demo (modals, pagination, forms)

## License

MIT 
