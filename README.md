# easier-djs

Drop-in Discord.js helpers: zero-config client setup, V2 cards, deploy tools, UX primitives. TypeScript-first with JS-friendly JSDoc.

## 🎯 Goals

- **Drop friction**: fewer foot-guns (intents, permissions, rate limits, V2 flags)
- **Fast to ship**: one-liners for deploy, pagination, confirm flows, and V2 cards
- **Type-safe but JS-friendly**: first-class TS types + good JSDoc for JS
- **Composable**: small helpers; no framework lock-in; tree-shakable
- **Production-ready**: retry/backoff, sharding helpers, diagnostics, error middleware

## 📦 Installation

```bash
npm install easier-djs discord.js
```

**Requirements:**
- Node.js >= 18.17 (LTS+ timers, fetch, URL)
- discord.js ^14.19.0+

## 🚀 Quick Start

### TypeScript

```typescript
import { createClient, deploy, card, btn } from 'easier-djs';
import { SlashCommandBuilder, ActionRowBuilder } from 'discord.js';

const client = createClient({ 
  features: ['commands', 'v2', 'diagnostics'] 
});

const commands = [{
  data: new SlashCommandBuilder().setName('server').setDescription('Show server info'),
  async run(interaction) {
    const ui = card()
      .color(0x5865f2)
      .section(`**${interaction.guild?.name}**\nMembers: ${interaction.guild?.memberCount}`)
      .withActions(
        new ActionRowBuilder().addComponents(
          btn.primary('refresh', 'Refresh')
        )
      );
    await interaction.reply(ui);
  }
}];

await deploy(client, commands, { scope: 'guild', guildId: 'YOUR_GUILD_ID' });
await client.login(process.env.DISCORD_TOKEN);
```

### JavaScript

```javascript
const { createClient, deploy, card, btn } = require('easier-djs');
const { SlashCommandBuilder, ActionRowBuilder } = require('discord.js');

const client = createClient({ features: ['commands', 'v2'] });

const commands = [{
  data: new SlashCommandBuilder().setName('ping').setDescription('Ping'),
  run: async (interaction) => {
    const ui = card().section('🏓 Pong!');
    await interaction.reply(ui.withActions());
  }
}];

deploy(client, commands, { scope: 'guild', guildId: process.env.DEV_GUILD_ID })
  .then(() => client.login(process.env.DISCORD_TOKEN));
```

## ✅ What's Implemented (v0.1 MVP)

### 🔧 Client & Diagnostics
- `createClient()` - Automatic intent configuration based on features
- `diagnose()` - Comprehensive health checks and troubleshooting

### 📋 Commands
- `deploy()` - Smart command deployment with diff display
- `createCommandHandler()` - Simple command routing with error handling
- `loadCommands()` / `loadCommandsAsync()` - Command loading utilities

### 🎨 V2 Components
- `card()` - Fluent V2 card builder with auto-flags
- `btn.*` - Button helpers (primary, secondary, danger, link)
- `convertEmbed()` - Migration helper from EmbedBuilder

### 🎯 UX Primitives  
- `confirm()` - Yes/No confirmation dialogs with timeout
- `paginate()` - Automatic pagination for large lists
- `collectButtons()` - Component interaction collection

### 🛡️ Error Handling
- `installInteractionErrorHandler()` - Auto error middleware
- `createLogger()` - Redacting logger with security
- Custom error classes with proper codes

## 🔜 Coming Soon

### v0.2
- ✏️ **Modals & Forms** - Schema-first modal builders
- 🔄 **REST Helpers** - Rate-limit safe with retries  
- 💾 **Cache Adapters** - Memory + Redis support

### v0.3  
- 🌐 **Sharding** - Auto-scaling helpers
- 🌍 **i18n** - Locale-aware responses
- 🔄 **Migration Tools** - V1 → V2 upgrade utilities

### v1.0
- 🧪 **Testing Kit** - Mock interactions & snapshots
- 📖 **Full Documentation** - Complete API reference
- ⚡ **Performance** - Benchmarks & optimizations

## 📖 API Reference

### createClient(options?)

Automatically configures Discord.js client with smart intent detection.

```typescript
const client = createClient({
  features: ['commands', 'members', 'v2'],  // Auto-configures intents
  handleErrors: true,                        // Install error middleware
  logger: myLogger                          // Custom logger
});
```

**Features:**
- `commands` - Slash commands (no extra intents)
- `messages` - Message content + guild messages
- `members` - Guild members (privileged)
- `reactions` - Message reactions  
- `voice` - Voice state changes
- `v2` - V2 components (no extra intents)
- `diagnostics` - Basic guild access for health checks

### card()

Fluent V2 component builder that eliminates boilerplate.

```typescript
const ui = card()
  .color(0x5865f2)                    // Embed color
  .section("**Title**\nContent")      // Text section with markdown
  .thumb(url)                         // Thumbnail image
  .image(url)                         // Main image  
  .footer("Footer text")              // Footer
  .withActions(actionRow);            // Auto-sets V2 flags
```

### UX Helpers

```typescript
// Confirmation dialog
if (await confirm(interaction, "Delete channel?")) {
  // User confirmed
}

// Pagination
await paginate(interaction, longList, { perPage: 10 });

// Button collection
const clicks = await collectButtons(message, { time: 30000 });
```

## 🏗️ Development

```bash
# Install dependencies
npm install

# Build (ESM + CJS + .d.ts)
npm run build

# Development build with watch
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint
```

## 📂 Project Structure

```
easier-djs/
  src/
    client/          # createClient, intents presets, diagnostics  
    commands/        # deploy, loader, guards/checks
    v2/              # card(), sections, media, buttons/selects
    ux/              # paginate, confirm, wizards, collectors
    rest/            # rate-limit safe REST, retries (v0.2)
    perms/           # permission helpers (v0.2)  
    shards/          # autoShard(), health, IPC (v0.3)
    cache/           # safe getters, adapters (v0.2)
    i18n/            # tiny t() with locale detection (v0.3)
    errors/          # error classes, middleware
    types/           # shared TS types
    index.ts         # flat re-exports
  examples/
    ts/              # TypeScript examples
    js/              # JavaScript examples  
  tests/             # Test suite (coming v1.0)
```

## 🤝 Contributing

This project is in active development. The v0.1 MVP focuses on core functionality:

1. **Client setup** - Remove intent configuration pain
2. **V2 components** - Eliminate boilerplate and auto-flags  
3. **Command deployment** - Smart diffing and deployment
4. **UX primitives** - Pagination, confirmation, collection
5. **Error handling** - Production-ready error middleware

See the [roadmap](#-coming-soon) for planned features in upcoming versions.

## 📄 License

MIT License - see LICENSE file for details.

---

**easier-djs** - Making Discord.js easier, one helper at a time. 
