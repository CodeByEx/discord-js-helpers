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

// Create client with automatic intent configuration
const client = createClient({ 
  features: ['commands', 'v2', 'diagnostics'],
  handleErrors: true
});

// Sample data for pagination
const sampleItems = Array.from({ length: 50 }, (_, i) => ({
  title: `Item ${i + 1}`,
  description: `This is the description for item ${i + 1}. It contains some sample text to demonstrate pagination.`
}));

// Define commands
const commands: CommandDefinition[] = [
  {
    data: new SlashCommandBuilder()
      .setName('enhanced-demo')
      .setDescription('Showcase enhanced v2 features'),
    async run(interaction, { client, logger }) {
      const ui = msg()
        .title('🎉 Enhanced V2 Features Demo')
        .text('This demonstrates the new enhanced features:')
        .separator()
        .text('• **Modals** - Contact forms, feedback forms')
        .text('• **Pagination** - Built-in pagination helpers')
        .text('• **Media Galleries** - Image collections')
        .text('• **Thumbnails** - Image accessories')
        .text('• **Form Builders** - Complex form creation')
        .separator()
        .text('Use the buttons below to explore each feature!')
        .buttons(
          btn.primary('show_modals', '📝 Modals'),
          btn.secondary('show_pagination', '📄 Pagination'),
          btn.success('show_gallery', '🖼️ Gallery'),
          btn.danger('show_form', '📋 Forms')
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
      .setName('pagination-demo')
      .setDescription('Demonstrate pagination features'),
    async run(interaction, { client, logger }) {
      const pagination = createPagination({
        items: sampleItems,
        itemsPerPage: 5,
        currentPage: 1,
        showPageInfo: true,
        showNavigation: true
      });

      await interaction.reply(pagination);
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('gallery-demo')
      .setDescription('Show media gallery features'),
    async run(interaction, { client, logger }) {
      const ui = msg()
        .title('🖼️ Media Gallery Demo')
        .text('This shows how to use media galleries and thumbnails:')
        .separator()
        .text('**Sample Images:**')
        .mediaGallery([
          'https://picsum.photos/300/200?random=1',
          'https://picsum.photos/300/200?random=2',
          'https://picsum.photos/300/200?random=3'
        ])
        .separator()
        .text('**With Thumbnail:**')
        .thumbnail('https://picsum.photos/100/100?random=4', 'Sample thumbnail')
        .text('This message has a thumbnail accessory')
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
  },
  {
    data: new SlashCommandBuilder()
      .setName('form-demo')
      .setDescription('Show form builder features'),
    async run(interaction, { client, logger }) {
      const ui = msg()
        .title('📋 Form Builder Demo')
        .text('Click the buttons below to see different form types:')
        .separator()
        .text('• **Contact Form** - Name, email, subject, message')
        .text('• **Feedback Form** - Rating, feedback, suggestions')
        .text('• **Custom Form** - Build your own form fields')
        .buttons(
          btn.primary('contact_form', '📧 Contact Form'),
          btn.secondary('feedback_form', '⭐ Feedback Form'),
          btn.success('custom_form', '🔧 Custom Form')
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
    case 'show_modals':
      const modal = modalV2.contact('contact_' + Date.now());
      await interaction.showModal(modal);
      break;
      
    case 'show_pagination':
      const pagination = createPagination({
        items: sampleItems,
        itemsPerPage: 3,
        currentPage: 1,
        showPageInfo: true,
        showNavigation: true
      });
      await interaction.reply(pagination);
      break;
      
    case 'show_gallery':
      const galleryMsg = msg()
        .title('🖼️ Gallery Demo')
        .text('Here are some sample images:')
        .mediaGallery([
          'https://picsum.photos/400/300?random=5',
          'https://picsum.photos/400/300?random=6',
          'https://picsum.photos/400/300?random=7'
        ])
        .footer('Gallery demo')
        .build();
      await interaction.reply(galleryMsg);
      break;
      
    case 'show_form':
      const customForm = modalV2.create('custom_' + Date.now(), 'Custom Form', [
        { id: 'name', label: 'Name', placeholder: 'Enter your name', required: true },
        { id: 'age', label: 'Age', placeholder: 'Enter your age', required: true },
        { id: 'bio', label: 'Bio', placeholder: 'Tell us about yourself', style: 2, required: false }
      ]);
      await interaction.showModal(customForm);
      break;
      
    case 'contact_form':
      const contactModal = modalV2.contact('contact_' + Date.now());
      await interaction.showModal(contactModal);
      break;
      
    case 'feedback_form':
      const feedbackModal = modalV2.feedback('feedback_' + Date.now());
      await interaction.showModal(feedbackModal);
      break;
      
    case 'custom_form':
      const settingsForm = modalV2.settings('settings_' + Date.now(), [
        'Username',
        'Email',
        'Timezone',
        'Language'
      ]);
      await interaction.showModal(settingsForm);
      break;
      
    case 'page_first':
    case 'page_prev':
    case 'page_next':
    case 'page_last':
      // Handle pagination navigation
      const currentPage = parseInt(interaction.message?.components?.[0]?.components?.[0]?.custom_id?.split('_')[1] || '1');
      let newPage = currentPage;
      
      switch (interaction.customId) {
        case 'page_first': newPage = 1; break;
        case 'page_prev': newPage = Math.max(1, currentPage - 1); break;
        case 'page_next': newPage = Math.min(10, currentPage + 1); break;
        case 'page_last': newPage = 10; break;
      }
      
      const newPagination = createPagination({
        items: sampleItems,
        itemsPerPage: 5,
        currentPage: newPage,
        showPageInfo: true,
        showNavigation: true
      });
      
      await interaction.update(newPagination);
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

// Deploy commands and start bot
async function main() {
  try {
    console.log('🚀 Starting enhanced features demo bot...');
    
    // Deploy commands (use guild for development, global for production)
    await deploy(client, commands, {
      scope: process.env.NODE_ENV === 'production' ? 'global' : 'guild',
      guildId: process.env.DEV_GUILD_ID,
      confirm: false
    });
    
    // Login to Discord
    await client.login(process.env.DISCORD_TOKEN);
    
    console.log(`✅ Enhanced features demo bot is ready as ${client.user?.tag}`);
    console.log('📝 Try these commands:');
    console.log('  /enhanced-demo - Main demo');
    console.log('  /pagination-demo - Pagination features');
    console.log('  /gallery-demo - Media gallery features');
    console.log('  /form-demo - Form builder features');
    
  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

main(); 