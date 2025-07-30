const { createClient, deploy, card, btn, createCommandHandler } = require('discord-js-helpers');
const { SlashCommandBuilder, ActionRowBuilder } = require('discord.js');

// Create client with automatic intent configuration
const client = createClient({ 
  features: ['commands', 'v2', 'diagnostics'],
  handleErrors: true
});

// Define commands
const commands = [
  {
    data: new SlashCommandBuilder()
      .setName('server')
      .setDescription('Show server information'),
    run: async (interaction, { client, logger }) => {
      const guild = interaction.guild;
      if (!guild) {
        await interaction.reply({ content: 'This command must be used in a server!', ephemeral: true });
        return;
      }

      const ui = card()
        .color(0x5865f2)
        .section(`**${guild.name}**\n\nMembers: ${guild.memberCount}\nCreated: <t:${Math.floor(guild.createdTimestamp / 1000)}:R>`)
        .thumb(guild.iconURL() || undefined)
        .footer('Server information')
        .withActions(
          new ActionRowBuilder().addComponents(
            btn.primary('refresh_server', 'Refresh'),
            btn.secondary('more_info', 'More Info')
          )
        );

      await interaction.reply(ui);
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('ping')
      .setDescription('Check bot latency'),
    run: async (interaction, { client, logger }) => {
      const sent = await interaction.reply({ 
        content: 'Pinging...', 
        fetchReply: true 
      });
      
      const latency = sent.createdTimestamp - interaction.createdTimestamp;
      const wsLatency = client.ws.ping;
      
      const ui = card()
        .color(0x00ff00)
        .section(`🏓 **Pong!**\n\nLatency: ${latency}ms\nWebSocket: ${wsLatency}ms`)
        .footer('Bot latency check');
      
      await interaction.editReply(ui.withActions());
    }
  }
];

// Install command handler
client.on('interactionCreate', createCommandHandler(commands));

// Handle button interactions
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;
  
  switch (interaction.customId) {
    case 'refresh_server':
      await interaction.reply({ content: '🔄 Refreshed server info!', ephemeral: true });
      break;
    case 'more_info':
      await interaction.reply({ content: 'ℹ️ More features coming soon!', ephemeral: true });
      break;
  }
});

// Deploy commands and start bot
async function main() {
  try {
    console.log('🚀 Starting discord-js-helpers example bot...');
    
    // Deploy commands (use guild for development, global for production)
    await deploy(client, commands, {
      scope: process.env.NODE_ENV === 'production' ? 'global' : 'guild',
      guildId: process.env.DEV_GUILD_ID,
      confirm: false
    });
    
    // Login to Discord
    await client.login(process.env.DISCORD_TOKEN);
    
    console.log(`✅ Bot is ready as ${client.user?.tag}`);
    
  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

main(); 