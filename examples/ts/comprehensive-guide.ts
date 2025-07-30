/**
 * Comprehensive Guide - Discord.js Helpers
 * 
 * This example demonstrates all the features available in discord-js-helpers
 * including V2 components, modals, pagination, and more.
 */

import { 
  createClient, 
  deploy, 
  msg, 
  embed, 
  btn, 
  select,
  modalV2,
  createPagination,
  createForm,
  createCommandHandler
} from 'discord-js-helpers';
import { SlashCommandBuilder } from 'discord.js';
import type { CommandDefinition } from 'discord-js-helpers';

// Create client with all features enabled
const client = createClient({ 
  features: ['commands', 'v2', 'diagnostics'],
  handleErrors: true
});

// Sample data for demonstrations
const sampleItems = Array.from({ length: 25 }, (_, i) => ({
  title: `Item ${i + 1}`,
  description: `This is the description for item ${i + 1}. It contains sample text to demonstrate pagination and other features.`
}));

const commands: CommandDefinition[] = [
  {
    data: new SlashCommandBuilder()
      .setName('guide')
      .setDescription('Show comprehensive feature guide'),
    async run(interaction, { client, logger }) {
      const ui = msg()
        .title('📚 Discord.js Helpers - Comprehensive Guide')
        .text('This guide demonstrates all available features:')
        .separator()
        .text('**Core Features:**')
        .text('• Simple message building with `msg()`')
        .text('• Embed-like structures with `embed()`')
        .text('• Button helpers with `btn.*`')
        .text('• Select menu helpers with `select.*`')
        .separator()
        .text('**Enhanced Features:**')
        .text('• Modal forms with `modalV2.*`')
        .text('• Pagination with `createPagination()`')
        .text('• Form builders with `createForm()`')
        .text('• Media galleries and thumbnails')
        .separator()
        .text('**Migration Tools:**')
        .text('• Convert v1 embeds to v2 with `convertEmbed()`')
        .text('• Batch migration with `migrateEmbeds()`')
        .footer('Click the buttons below to explore each feature')
        .buttons(
          btn.primary('show_basics', '📝 Basic Features'),
          btn.secondary('show_enhanced', '⚡ Enhanced Features'),
          btn.success('show_migration', '🔄 Migration Tools'),
          btn.danger('show_advanced', '🚀 Advanced Examples')
        )
        .build();

      await interaction.reply({ 
        components: ui.components,
        flags: ui.flags as any
      });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('basics')
      .setDescription('Demonstrate basic features'),
    async run(interaction, { client, logger }) {
      const ui = msg()
        .title('📝 Basic Features Demo')
        .text('**Simple Message Building:**')
        .text('Create rich messages with markdown support, buttons, and select menus.')
        .separator()
        .text('**Message with Buttons:**')
        .buttons(
          btn.primary('demo_action', 'Primary Action'),
          btn.secondary('demo_help', 'Secondary Help'),
          btn.danger('demo_delete', 'Danger Delete'),
          btn.success('demo_success', 'Success!')
        )
        .build();

      await interaction.reply({ 
        components: ui.components,
        flags: ui.flags as any
      });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('embed-demo')
      .setDescription('Demonstrate embed-like structures'),
    async run(interaction, { client, logger }) {
      const ui = embed()
        .title('🏗️ Embed-like Structure')
        .description('This demonstrates the embed-like structure using V2 components.')
        .color(0x5865f2)
        .field('Server Info', 'Members: 1000\nChannels: 50', true)
        .field('Bot Info', 'Uptime: 24h\nCommands: 15', true)
        .field('Features', 'V2 Components\nModals\nPagination\nForm Builders', false)
        .thumbnail('https://cdn.discordapp.com/embed/avatars/0.png')
        .footer('Powered by Discord.js Helpers')
        .timestamp(new Date())
        .buttons(
          btn.success('join_server', 'Join Server'),
          btn.link('https://discord.js.org', 'Visit Discord.js')
        )
        .build();

      await interaction.reply({ 
        components: ui.components,
        flags: ui.flags as any
      });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('select-demo')
      .setDescription('Demonstrate select menus'),
    async run(interaction, { client, logger }) {
      const ui = msg()
        .title('📋 Select Menu Demo')
        .text('Choose from the options below:')
        .separator()
        .text('**String Select Menu:**')
        .select(select.string('string_choice', 'Select an option', [
          { label: 'Option 1', value: 'opt1', description: 'First option' },
          { label: 'Option 2', value: 'opt2', description: 'Second option' },
          { label: 'Option 3', value: 'opt3', description: 'Third option' }
        ]))
        .separator()
        .text('**User Select Menu:**')
        .select(select.user('user_choice', 'Select a user'))
        .separator()
        .text('**Role Select Menu:**')
        .select(select.role('role_choice', 'Select a role'))
        .build();

      await interaction.reply({ 
        components: ui.components,
        flags: ui.flags as any
      });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('pagination-demo')
      .setDescription('Demonstrate pagination features'),
    async run(interaction, { client, logger }) {
      const pagination = createPagination({
        items: sampleItems,
        itemsPerPage: 3,
        currentPage: 1,
        showPageInfo: true,
        showNavigation: true
      });

      await interaction.reply(pagination);
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('modal-demo')
      .setDescription('Demonstrate modal forms'),
    async run(interaction, { client, logger }) {
      const ui = msg()
        .title('📝 Modal Forms Demo')
        .text('Click the buttons below to see different modal types:')
        .separator()
        .text('**Predefined Forms:**')
        .text('• Contact Form - Name, email, subject, message')
        .text('• Feedback Form - Rating, feedback, suggestions')
        .text('• Settings Form - Dynamic field generation')
        .separator()
        .text('**Custom Forms:**')
        .text('• Build your own forms with validation')
        .text('• Support for different input styles')
        .text('• Min/max length validation')
        .buttons(
          btn.primary('contact_form', '📧 Contact Form'),
          btn.secondary('feedback_form', '⭐ Feedback Form'),
          btn.success('settings_form', '⚙️ Settings Form'),
          btn.danger('custom_form', '🔧 Custom Form')
        )
        .build();

      await interaction.reply({ 
        components: ui.components,
        flags: ui.flags as any
      });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('media-demo')
      .setDescription('Demonstrate media features'),
    async run(interaction, { client, logger }) {
      const ui = msg()
        .title('🖼️ Media Features Demo')
        .text('This demonstrates media galleries and thumbnails:')
        .separator()
        .text('**Media Gallery:**')
        .mediaGallery([
          'https://picsum.photos/300/200?random=1',
          'https://picsum.photos/300/200?random=2',
          'https://picsum.photos/300/200?random=3'
        ])
        .separator()
        .text('**With Thumbnail:**')
        .thumbnail('https://picsum.photos/100/100?random=4', 'Sample thumbnail')
        .text('This message has a thumbnail accessory')
        .separator()
        .text('**Individual Images:**')
        .image('https://picsum.photos/400/300?random=5', 'Main image')
        .text('You can also add individual images')
        .buttons(
          btn.primary('view_more', 'View More Images'),
          btn.secondary('close', 'Close')
        )
        .build();

      await interaction.reply({ 
        components: ui.components,
        flags: ui.flags as any
      });
    }
  }
];

// Install command handler
client.on('interactionCreate', createCommandHandler(commands));

// Handle button interactions
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;
  
  switch (interaction.customId) {
    case 'show_basics':
      const basicsMsg = msg()
        .title('📝 Basic Features')
        .text('**Simple Message Building:**')
        .text('• Use `msg()` for simple messages')
        .text('• Use `embed()` for embed-like structures')
        .text('• Add buttons with `btn.*` helpers')
        .text('• Add select menus with `select.*` helpers')
        .separator()
        .text('**Example:**')
        .text('```typescript')
        .text('const message = msg()')
        .text('  .title("Welcome!")')
        .text('  .text("This is a message")')
        .text('  .buttons(btn.primary("click", "Click me"))')
        .text('  .build();')
        .text('```')
        .footer('Basic features demo')
        .build();
      await interaction.reply(basicsMsg);
      break;
      
    case 'show_enhanced':
      const enhancedMsg = msg()
        .title('⚡ Enhanced Features')
        .text('**Modal Forms:**')
        .text('• `modalV2.contact()` - Contact forms')
        .text('• `modalV2.feedback()` - Feedback forms')
        .text('• `modalV2.create()` - Custom forms')
        .separator()
        .text('**Pagination:**')
        .text('• `createPagination()` - Built-in pagination')
        .text('• Navigation buttons and page info')
        .separator()
        .text('**Media:**')
        .text('• `.mediaGallery()` - Image collections')
        .text('• `.thumbnail()` - Image accessories')
        .footer('Enhanced features demo')
        .build();
      await interaction.reply(enhancedMsg);
      break;
      
    case 'show_migration':
      const migrationMsg = msg()
        .title('🔄 Migration Tools')
        .text('**From V1 to V2:**')
        .text('• `convertEmbed()` - Convert single embed')
        .text('• `migrateEmbeds()` - Convert multiple embeds')
        .text('• `needsMigration()` - Check if migration needed')
        .separator()
        .text('**Example:**')
        .text('```typescript')
        .text('const oldEmbed = new EmbedBuilder()')
        .text('  .setTitle("Title")')
        .text('  .setDescription("Description");')
        .text('const newEmbed = convertEmbed(oldEmbed);')
        .text('```')
        .footer('Migration tools demo')
        .build();
      await interaction.reply(migrationMsg);
      break;
      
    case 'show_advanced':
      const advancedMsg = msg()
        .title('🚀 Advanced Examples')
        .text('**Complex Layouts:**')
        .text('• Combine multiple features')
        .text('• Dynamic content generation')
        .text('• Interactive workflows')
        .separator()
        .text('**Best Practices:**')
        .text('• Use TypeScript for better DX')
        .text('• Handle errors gracefully')
        .text('• Follow Discord.js guidelines')
        .separator()
        .text('**Performance:**')
        .text('• Efficient component building')
        .text('• Proper memory management')
        .text('• Optimized for large datasets')
        .footer('Advanced examples demo')
        .build();
      await interaction.reply(advancedMsg);
      break;
      
    case 'contact_form':
      const contactModal = modalV2.contact('contact_' + Date.now());
      await interaction.showModal(contactModal);
      break;
      
    case 'feedback_form':
      const feedbackModal = modalV2.feedback('feedback_' + Date.now());
      await interaction.showModal(feedbackModal);
      break;
      
    case 'settings_form':
      const settingsModal = modalV2.settings('settings_' + Date.now(), [
        'Username',
        'Email',
        'Timezone',
        'Language',
        'Theme'
      ]);
      await interaction.showModal(settingsModal);
      break;
      
    case 'custom_form':
      const customModal = modalV2.create('custom_' + Date.now(), 'Custom Form', [
        { id: 'name', label: 'Name', placeholder: 'Enter your name', required: true, minLength: 2, maxLength: 50 },
        { id: 'age', label: 'Age', placeholder: 'Enter your age', required: true },
        { id: 'bio', label: 'Bio', placeholder: 'Tell us about yourself', style: 2, required: false, maxLength: 1000 },
        { id: 'website', label: 'Website', placeholder: 'https://example.com', required: false }
      ]);
      await interaction.showModal(customModal);
      break;
      
    default:
      await interaction.reply({ content: 'Unknown action!', ephemeral: true });
  }
});

// Handle modal submissions
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isModalSubmit()) return;
  
  const modalId = interaction.customId;
  
  if (modalId.startsWith('contact_')) {
    const name = interaction.fields.getTextInputValue('name');
    const email = interaction.fields.getTextInputValue('email');
    const subject = interaction.fields.getTextInputValue('subject');
    const message = interaction.fields.getTextInputValue('message');
    
    const response = msg()
      .title('📧 Contact Form Submitted')
      .text(`**Name:** ${name}`)
      .text(`**Email:** ${email}`)
      .text(`**Subject:** ${subject}`)
      .text(`**Message:** ${message}`)
      .footer('Thank you for contacting us!')
      .build();
    
    await interaction.reply({ 
      components: response.components,
      flags: response.flags as any,
      ephemeral: true 
    });
  }
  
  else if (modalId.startsWith('feedback_')) {
    const rating = interaction.fields.getTextInputValue('rating');
    const feedback = interaction.fields.getTextInputValue('feedback');
    const suggestions = interaction.fields.getTextInputValue('suggestions');
    
    const response = msg()
      .title('⭐ Feedback Received')
      .text(`**Rating:** ${rating}/10`)
      .text(`**Feedback:** ${feedback}`)
      .text(`**Suggestions:** ${suggestions || 'None provided'}`)
      .footer('Thank you for your feedback!')
      .build();
    
    await interaction.reply({ 
      components: response.components,
      flags: response.flags as any,
      ephemeral: true 
    });
  }
  
  else if (modalId.startsWith('settings_') || modalId.startsWith('custom_')) {
    const fields = interaction.fields.fields;
    const response = msg()
      .title('⚙️ Form Submitted')
      .text('**Submitted Data:**');
    
    for (const [id, field] of fields) {
      response.text(`**${id}:** ${field.value}`);
    }
    
    response.footer('Form processed successfully!');
    
    await interaction.reply({ 
      components: response.build().components,
      flags: response.build().flags as any,
      ephemeral: true 
    });
  }
});

// Handle select menu interactions
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isStringSelectMenu() && !interaction.isUserSelectMenu() && !interaction.isRoleSelectMenu()) return;
  
  const response = msg()
    .title('📋 Selection Made')
    .text(`**Menu ID:** ${interaction.customId}`)
    .text(`**Selected Values:** ${interaction.values.join(', ')}`)
    .footer('Selection processed')
    .build();
  
  await interaction.reply({ 
    components: response.components,
    flags: response.flags as any,
    ephemeral: true 
  });
});

// Deploy commands and start bot
async function main() {
  try {
    console.log('🚀 Starting comprehensive guide bot...');
    
    // Deploy commands (use guild for development, global for production)
    await deploy(client, commands, {
      scope: process.env.NODE_ENV === 'production' ? 'global' : 'guild',
      guildId: process.env.DEV_GUILD_ID,
      confirm: false
    });
    
    // Login to Discord
    await client.login(process.env.DISCORD_TOKEN);
    
    console.log(`✅ Comprehensive guide bot is ready as ${client.user?.tag}`);
    console.log('📝 Try these commands:');
    console.log('  /guide - Main comprehensive guide');
    console.log('  /basics - Basic features demo');
    console.log('  /embed-demo - Embed-like structures');
    console.log('  /select-demo - Select menu examples');
    console.log('  /pagination-demo - Pagination features');
    console.log('  /modal-demo - Modal form examples');
    console.log('  /media-demo - Media gallery features');
    
  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

main(); 