import { 
  createClient, 
  deploy, 
  msg, 
  embed, 
  btn, 
  createCommandHandler,
  autoShard,
  shardHealth,
  createI18n,
  convertEmbed,
  migrateEmbeds,
  needsMigration,
  migrateMessage
} from 'discord-js-helpers';
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { CommandDefinition } from 'discord-js-helpers';

// Create client with all features enabled
const client = createClient({ 
  features: ['commands', 'messages', 'members', 'v2', 'diagnostics'],
  handleErrors: true
});

// Initialize i18n with multiple locales
const i18n = createI18n({
  en: {
    'welcome': 'Welcome to the server!',
    'ping': 'Pong! Latency: {latency}ms',
    'shard_info': 'Shard {id}: {status} ({guilds} guilds)',
    'health_summary': 'Health: {online}/{total} shards online, {avgPing}ms avg ping'
  },
  es: {
    'welcome': '¡Bienvenido al servidor!',
    'ping': '¡Pong! Latencia: {latency}ms',
    'shard_info': 'Fragmento {id}: {status} ({guilds} servidores)',
    'health_summary': 'Salud: {online}/{total} fragmentos en línea, {avgPing}ms ping promedio'
  },
  fr: {
    'welcome': 'Bienvenue sur le serveur!',
    'ping': 'Pong! Latence: {latency}ms',
    'shard_info': 'Fragment {id}: {status} ({guilds} serveurs)',
    'health_summary': 'Santé: {online}/{total} fragments en ligne, {avgPing}ms ping moyen'
  }
}, {
  defaultLocale: 'en',
  fallbackLocale: 'en'
});

// Commands demonstrating v0.3 features
const commands: CommandDefinition[] = [
  {
    data: new SlashCommandBuilder()
      .setName('welcome')
      .setDescription('Welcome message with i18n')
      .addStringOption(option => 
        option.setName('locale')
          .setDescription('Language for the message')
          .addChoices(
            { name: 'English', value: 'en' },
            { name: 'Español', value: 'es' },
            { name: 'Français', value: 'fr' }
          )
      ),
    async run(interaction, { client, logger }) {
      const locale = interaction.options.getString('locale') || 'en';
      const message = i18n.t('welcome', locale);
      
      const ui = msg()
        .text(message)
        .footer(`Locale: ${locale}`)
        .buttons(btn.primary('ok', 'OK'))
        .build();
      
      await interaction.reply(ui);
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('shard-health')
      .setDescription('Check shard health status'),
    async run(interaction, { client, logger }) {
      const health = await shardHealth(client);
      
      const shardInfo = health.shards.map(shard => 
        i18n.t('shard_info', 'en', {
          id: shard.id,
          status: shard.status,
          guilds: shard.guilds
        })
      ).join('\n');
      
      const summary = i18n.t('health_summary', 'en', {
        online: health.online,
        total: health.total,
        avgPing: health.averagePing
      });
      
      const ui = msg()
        .text(`**Shard Health Report**\n\n${shardInfo}\n\n${summary}`)
        .footer(`Total Guilds: ${health.totalGuilds}`)
        .buttons(btn.primary('refresh', 'Refresh'))
        .build();
      
      await interaction.reply(ui);
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('migrate-demo')
      .setDescription('Demonstrate V1 to V2 migration'),
    async run(interaction, { client, logger }) {
      // Create a sample V1 embed
      const oldEmbed = new EmbedBuilder()
        .setTitle('Old V1 Embed')
        .setDescription('This is an old embed that needs migration')
        .setColor(0x5865f2)
        .addFields(
          { name: 'Field 1', value: 'Value 1', inline: true },
          { name: 'Field 2', value: 'Value 2', inline: true }
        )
        .setFooter({ text: 'Old footer' });
      
      // Convert to V2 embed
      const newEmbed = convertEmbed(oldEmbed).footer('Converted from V1').build();
      
      const ui = msg()
        .text('**Migration Demo**\n\n✅ Successfully converted V1 embed to V2!')
        .footer('Migration completed')
        .buttons(btn.primary('ok', 'OK'))
        .build();
      
      await interaction.reply(ui);
      // Show the converted embed in a follow-up
      await interaction.followUp({ 
        content: '**Converted V2 Embed:**',
        components: newEmbed.components,
        flags: newEmbed.flags as any
      });
    }
  }
];

// Install command handler
client.on('interactionCreate', createCommandHandler(commands));

// Handle broadcast events for sharding
client.on('broadcast', (message) => {
  console.log('Received broadcast:', message);
});

// Health monitoring (every 5 minutes)
setInterval(async () => {
  try {
    const health = await shardHealth(client);
    if (health.offline > 0) {
      console.warn(`⚠️  ${health.offline} shards offline`);
    }
  } catch (error) {
    console.error('Health check failed:', error);
  }
}, 5 * 60 * 1000);

// Main function
async function main() {
  try {
    console.log('🚀 Starting discord-js-helpers v0.3 example...');
    
    // Deploy commands
    await deploy(client, commands, {
      scope: process.env.NODE_ENV === 'production' ? 'global' : 'guild',
      guildId: process.env.DEV_GUILD_ID,
      confirm: false
    });
    
    // Login
    await client.login(process.env.DISCORD_TOKEN);
    
    console.log(`✅ Bot ready as ${client.user?.tag}`);
    console.log('📋 Available commands:', commands.map(c => c.data.name).join(', '));
    
    // Demonstrate sharding (if needed)
    if (process.env.USE_SHARDING === 'true') {
      console.log('🔧 Sharding mode enabled');
      const manager = autoShard(process.env.DISCORD_TOKEN!, {
        totalShards: 'auto',
        respawn: true
      });
      
      manager.on('shardCreate', (shard) => {
        console.log(`🔄 Launched shard ${shard.id}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

main(); 