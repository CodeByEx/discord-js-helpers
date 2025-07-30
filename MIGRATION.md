# Migration Guide: From Discord.js v1 to v2 Components

This guide helps you migrate from Discord.js v1 embeds and components to the new v2 components system using djs-helper-kit.

## 🚀 Quick Migration

### From v1 Embeds to v2 Components

**Before (v1):**
```typescript
import { EmbedBuilder } from 'discord.js';

const embed = new EmbedBuilder()
  .setTitle('Server Information')
  .setDescription('Details about the server')
  .setColor(0x5865f2)
  .addFields(
    { name: 'Members', value: '1000', inline: true },
    { name: 'Channels', value: '50', inline: true }
  )
  .setFooter({ text: 'Requested by user' })
  .setTimestamp();

await interaction.reply({ embeds: [embed] });
```

**After (v2):**
```typescript
import { embed } from 'djs-helper-kit';

const embedMsg = embed()
  .title('Server Information')
  .description('Details about the server')
  .color(0x5865f2)
  .field('Members', '1000', true)
  .field('Channels', '50', true)
  .footer('Requested by user')
  .timestamp()
  .build();

await interaction.reply(embedMsg);
```

### From v1 Buttons to v2 Components

**Before (v1):**
```typescript
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

const button = new ButtonBuilder()
  .setCustomId('action')
  .setLabel('Click me')
  .setStyle(ButtonStyle.Primary);

const row = new ActionRowBuilder<ButtonBuilder>()
  .addComponents(button);

await interaction.reply({ components: [row] });
```

**After (v2):**
```typescript
import { msg, btn } from 'djs-helper-kit';

const message = msg()
  .text('Click the button below!')
  .buttons(btn.primary('action', 'Click me'))
  .build();

await interaction.reply(message);
```

## 📋 Detailed Migration Steps

### 1. Update Imports

**Before:**
```typescript
import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  StringSelectMenuBuilder 
} from 'discord.js';
```

**After:**
```typescript
import { 
  msg, 
  embed, 
  btn, 
  select,
  modalV2,
  createPagination 
} from 'djs-helper-kit';
```

### 2. Convert EmbedBuilder to embed()

| v1 Method | v2 Method | Notes |
|-----------|-----------|-------|
| `setTitle()` | `.title()` | Same functionality |
| `setDescription()` | `.description()` | Same functionality |
| `setColor()` | `.color()` | Same functionality |
| `addFields()` | `.field()` | Call multiple times for multiple fields |
| `setThumbnail()` | `.thumbnail()` | Same functionality |
| `setImage()` | `.image()` | Same functionality |
| `setFooter()` | `.footer()` | Takes string instead of object |
| `setTimestamp()` | `.timestamp()` | Optional date parameter |

### 3. Convert ButtonBuilder to btn helpers

| v1 Style | v2 Helper | Example |
|----------|-----------|---------|
| `ButtonStyle.Primary` | `btn.primary()` | `btn.primary('id', 'label')` |
| `ButtonStyle.Secondary` | `btn.secondary()` | `btn.secondary('id', 'label')` |
| `ButtonStyle.Danger` | `btn.danger()` | `btn.danger('id', 'label')` |
| `ButtonStyle.Success` | `btn.success()` | `btn.success('id', 'label')` |
| `ButtonStyle.Link` | `btn.link()` | `btn.link('url', 'label')` |

### 4. Convert Select Menus to select helpers

| v1 Type | v2 Helper | Example |
|---------|-----------|---------|
| `StringSelectMenuBuilder` | `select.string()` | `select.string('id', 'placeholder', options)` |
| `UserSelectMenuBuilder` | `select.user()` | `select.user('id', 'placeholder')` |
| `RoleSelectMenuBuilder` | `select.role()` | `select.role('id', 'placeholder')` |
| `ChannelSelectMenuBuilder` | `select.channel()` | `select.channel('id', 'placeholder')` |

### 5. Handle Modal Submissions

**Before (v1):**
```typescript
const modal = new ModalBuilder()
  .setCustomId('form')
  .setTitle('Contact Form');

const nameInput = new TextInputBuilder()
  .setCustomId('name')
  .setLabel('Name')
  .setStyle(TextInputStyle.Short)
  .setRequired(true);

const row = new ActionRowBuilder<TextInputBuilder>()
  .addComponents(nameInput);

modal.addComponents(row);
```

**After (v2):**
```typescript
const modal = modalV2.create('form', 'Contact Form', [
  { id: 'name', label: 'Name', required: true }
]);
```

## 🔄 Migration Tools

### Automatic Migration

Use the built-in migration tools to convert existing embeds:

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

### Check if Migration is Needed

```typescript
import { needsMigration, migrateMessage } from 'djs-helper-kit';

if (needsMigration(message)) {
  const newEmbeds = migrateMessage(message);
  for (const embed of newEmbeds) {
    await interaction.followUp(embed.build());
  }
}
```

## 🆕 New Features

### Modal Forms

**Contact Form:**
```typescript
const contactModal = modalV2.contact('contact_form');
await interaction.showModal(contactModal);
```

**Feedback Form:**
```typescript
const feedbackModal = modalV2.feedback('feedback_form');
await interaction.showModal(feedbackModal);
```

**Custom Form:**
```typescript
const customModal = modalV2.create('custom', 'Form', [
  { id: 'name', label: 'Name', required: true },
  { id: 'email', label: 'Email', required: true },
  { id: 'message', label: 'Message', style: 2, required: false }
]);
await interaction.showModal(customModal);
```

### Pagination

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

### Media Galleries

```typescript
const message = msg()
  .title('Photo Gallery')
  .mediaGallery([
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg',
    'https://example.com/image3.jpg'
  ])
  .thumbnail('https://example.com/thumb.jpg', 'Thumbnail')
  .build();
```

## ⚠️ Breaking Changes

### 1. Message Structure

**Before (v1):**
```typescript
await interaction.reply({ 
  embeds: [embed],
  components: [actionRow] 
});
```

**After (v2):**
```typescript
const message = embed()
  .title('Title')
  .buttons(btn.primary('action', 'Click'))
  .build();

await interaction.reply(message);
```

### 2. Component Building

**Before (v1):**
```typescript
const row = new ActionRowBuilder<ButtonBuilder>()
  .addComponents(button1, button2);
```

**After (v2):**
```typescript
const message = msg()
  .buttons(btn.primary('action1', 'Button 1'), btn.secondary('action2', 'Button 2'))
  .build();
```

### 3. Modal Handling

**Before (v1):**
```typescript
const modal = new ModalBuilder()
  .setCustomId('form')
  .setTitle('Form');

// Add components manually...
```

**After (v2):**
```typescript
const modal = modalV2.create('form', 'Form', [
  { id: 'name', label: 'Name', required: true }
]);
```

## 🧪 Testing Migration

### 1. Test Basic Conversion

```typescript
// Test embed conversion
const oldEmbed = new EmbedBuilder()
  .setTitle('Test')
  .setDescription('Test description');

const newEmbed = convertEmbed(oldEmbed);
console.log('Conversion successful:', newEmbed.build());
```

### 2. Test Button Conversion

```typescript
// Test button helpers
const button = btn.primary('test', 'Test Button');
console.log('Button created:', button.data);
```

### 3. Test Modal Conversion

```typescript
// Test modal creation
const modal = modalV2.contact('test_contact');
console.log('Modal created:', modal.data);
```

## 📚 Best Practices

### 1. Gradual Migration

- Start with simple embeds and buttons
- Test each conversion thoroughly
- Use migration tools for batch conversions
- Keep v1 code as backup during transition

### 2. Error Handling

```typescript
try {
  const message = embed()
    .title('Title')
    .description('Description')
    .build();
  
  await interaction.reply(message);
} catch (error) {
  console.error('V2 conversion error:', error);
  // Fallback to v1
  await interaction.reply({ content: 'Error occurred' });
}
```

### 3. Performance Considerations

- V2 components are more efficient
- Use pagination for large datasets
- Leverage built-in helpers for common patterns
- Cache frequently used components

## 🆘 Troubleshooting

### Common Issues

1. **"Something went wrong" errors**
   - Check that all required fields are provided
   - Verify custom IDs are unique
   - Ensure proper error handling

2. **Modal submission errors**
   - Use proper field validation
   - Check field IDs match modal configuration
   - Handle all possible field types

3. **Component rendering issues**
   - Verify V2 flags are set correctly
   - Check component structure
   - Use built-in helpers for consistency

### Debug Tips

```typescript
// Enable debug logging
const message = msg()
  .title('Debug Message')
  .text('This is a debug message')
  .build();

console.log('Built message:', JSON.stringify(message, null, 2));
```

## 📖 Additional Resources

- [Discord.js v14 Documentation](https://discord.js.org/docs/packages/discord.js/14.14.1)
- [Discord Components v2 Guide](https://disky.me/docs/interactions/componentsv2/)
- [Discord.js Helpers Examples](./examples/)

## 🤝 Support

If you encounter issues during migration:

1. Check the [examples](./examples/) directory
2. Review the [comprehensive guide](./examples/ts/comprehensive-guide.ts)
3. Test with the [enhanced features demo](./examples/ts/enhanced-features.ts)
4. Use the migration tools provided

Happy migrating! 🚀 