import { 
  createClient, 
  deploy, 
  msg, 
  embed, 
  btn, 
  createCommandHandler, 
  createPrefixCommandHandler,
  modal,
  awaitModal,
  memoryCache,
  wrapRest
} from 'discord-js-helpers';
import { SlashCommandBuilder, ActionRowBuilder, REST } from 'discord.js';
import type { CommandDefinition, PrefixCommandDefinition } from 'discord-js-helpers';

// Create client with all features enabled
const client = createClient({ 
  features: ['commands', 'messages', 'members', 'v2', 'diagnostics'],
  handleErrors: true
});

// Initialize cache
const cache = memoryCache();

// Slash commands
const commands: CommandDefinition[] = [
  {
    data: new SlashCommandBuilder()
      .setName('report')
      .setDescription('Report a user with a form'),
    async run(interaction, { client, logger }) {
      const form = modal('report', 'Report User', [
        { id: 'user', label: 'User ID', required: true, placeholder: '123456789' },
        { id: 'reason', label: 'Reason', style: 'paragraph', maxLength: 1000, required: true }
      ]);

      try {
        const data = await awaitModal(interaction, form);
        
        // Store in cache
        await cache.set(`report:${Date.now()}`, data, 3600); // 1 hour TTL
        
        const ui = embed()
          .color(0xff0000)
          .title('🚨 **Report Submitted**')
          .description(`**User:** ${data.user}\n**Reason:** ${data.reason}`)
          .footer('Report will be reviewed by moderators');
        
        await interaction.followUp({ content: 'Report submitted successfully!', ephemeral: true });
        const response = ui.buttons(btn.primary('Close', 'close')).build();
        if (interaction.channel?.isTextBased() && 'send' in interaction.channel) {
          await (interaction.channel as any).send({ 
            components: response.components,
            flags: response.flags as any
          });
        }
        
      } catch (error) {
        await interaction.followUp({ content: 'Report submission was cancelled or timed out.', ephemeral: true });
      }
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('cache')
      .setDescription('Test cache functionality'),
    async run(interaction, { client, logger }) {
      const key = `test:${interaction.user.id}`;
      const value = { timestamp: Date.now(), user: interaction.user.tag };
      
      await cache.set(key, value, 300); // 5 minutes TTL
      const retrieved = await cache.get(key);
      
      const ui = embed()
        .color(0x00ff00)
        .title('💾 **Cache Test**')
        .description(`**Stored:** ${JSON.stringify(value)}\n**Retrieved:** ${JSON.stringify(retrieved)}`)
        .footer('Cache test completed');
      
      const response = ui.buttons(btn.primary('Close', 'close')).build();
      await interaction.reply({ 
        components: response.components,
        flags: response.flags as any
      });
    }
  }
];

// Prefix commands
const prefixCommands: PrefixCommandDefinition[] = [
  {
    name: 'ping',
    aliases: ['p'],
    description: 'Check bot latency',
    run: async (message, args, { client, logger }) => {
      const sent = await message.reply('Pinging...');
      const latency = sent.createdTimestamp - message.createdTimestamp;
      const wsLatency = client.ws.ping;
      
      await sent.edit(`🏓 **Pong!**\nLatency: ${latency}ms\nWebSocket: ${wsLatency}ms`);
    }
  },
  {
    name: 'echo',
    description: 'Echo a message',
    run: async (message, args, { client, logger }) => {
      if (args.length === 0) {
        await message.reply('Please provide a message to echo!');
        return;
      }
      
      const text = args.join(' ');
      await message.reply(text);
    }
  },
  {
    name: 'help',
    aliases: ['h', 'commands'],
    description: 'Show available commands',
    run: async (message, args, { client, logger }) => {
      const commandList = prefixCommands
        .filter(cmd => !cmd.hidden)
        .map(cmd => `**${cmd.name}**${cmd.aliases ? ` (${cmd.aliases.join(', ')})` : ''} - ${cmd.description || 'No description'}`)
        .join('\n');
      
      const ui = embed()
        .color(0x0099ff)
        .title('📚 **Available Commands**')
        .description(`${commandList}\n\nUse !help <command> for more info`);
      
      const response = ui.buttons(btn.primary('Close', 'close')).build();
      await message.reply({ 
        components: response.components,
        flags: response.flags as any
      });
    }
  }
];

// Install command handlers
client.on('interactionCreate', createCommandHandler(commands));
client.on('messageCreate', createPrefixCommandHandler(prefixCommands, '!'));

// Enhanced REST with retry logic
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);
const enhancedRest = wrapRest(rest, { 
  maxRetries: 3, 
  baseDelayMs: 1000 
});

// Deploy commands and start bot
async function main() {
  try {
    console.log('🚀 Starting advanced discord-js-helpers example bot...');
    
    // Deploy slash commands
    await deploy(client, commands, {
      scope: process.env.NODE_ENV === 'production' ? 'global' : 'guild',
      guildId: process.env.DEV_GUILD_ID,
      confirm: false
    });
    
    // Login to Discord
    await client.login(process.env.DISCORD_TOKEN);
    
    console.log(`✅ Bot is ready as ${client.user?.tag}`);
    console.log('📋 Available slash commands:', commands.map(c => c.data.name).join(', '));
    console.log('📋 Available prefix commands:', prefixCommands.map(c => c.name).join(', '));
    
  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

main(); 