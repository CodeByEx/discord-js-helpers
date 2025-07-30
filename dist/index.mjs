import { GatewayIntentBits, Client, REST, Routes, TextInputStyle, ModalBuilder, TextInputBuilder, ActionRowBuilder, ContainerBuilder, TextDisplayBuilder, MessageFlags, ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder, RoleSelectMenuBuilder, UserSelectMenuBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ComponentType, ShardingManager } from 'discord.js';
import { readdir, stat } from 'fs/promises';
import { join, extname } from 'path';
import { pathToFileURL } from 'url';

// djs-helper-kit - Discord.js helpers with zero config

var FEATURE_INTENTS = {
  commands: [],
  messages: [GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages],
  members: [GatewayIntentBits.GuildMembers],
  reactions: [GatewayIntentBits.GuildMessageReactions],
  voice: [GatewayIntentBits.GuildVoiceStates],
  v2: [],
  // V2 components don't need special intents
  diagnostics: [GatewayIntentBits.Guilds]
  // Need basic guild access for diagnostics
};
function createClient(options = {}) {
  const {
    features = ["commands"],
    additionalIntents = [],
    partials = [],
    handleErrors = true,
    logger = createDefaultLogger()
  } = options;
  const intents = /* @__PURE__ */ new Set();
  intents.add(GatewayIntentBits.Guilds);
  for (const feature of features) {
    const featureIntents = FEATURE_INTENTS[feature];
    if (featureIntents) {
      featureIntents.forEach((intent) => intents.add(intent));
    } else {
      logger.warn(`Unknown feature: ${feature}`);
    }
  }
  additionalIntents.forEach((intent) => intents.add(intent));
  const client = new Client({
    intents: Array.from(intents),
    partials
  });
  if (handleErrors) {
    installErrorHandling(client, logger);
  }
  client.__easierDjsFeatures = features;
  client.__easierDjsLogger = logger;
  return client;
}
async function diagnose(client) {
  const logger = client.__easierDjsLogger || createDefaultLogger();
  const features = client.__easierDjsFeatures || [];
  logger.info("\u{1F50D} Running djs-helper-kit diagnostics...");
  if (!client.isReady()) {
    logger.warn("\u26A0\uFE0F  Client is not ready yet. Some checks may be incomplete.");
  }
  if (!process.env.DISCORD_TOKEN && !client.token) {
    logger.error("\u274C No Discord token found. Set DISCORD_TOKEN environment variable.");
  } else {
    logger.info("\u2705 Discord token configured");
  }
  checkIntents(client, features, logger);
  if (client.isReady()) {
    const wsLatency = client.ws.ping;
    if (wsLatency < 100) {
      logger.info(`\u2705 WebSocket latency: ${wsLatency}ms (excellent)`);
    } else if (wsLatency < 300) {
      logger.info(`\u26A0\uFE0F  WebSocket latency: ${wsLatency}ms (good)`);
    } else {
      logger.warn(`\u26A0\uFE0F  WebSocket latency: ${wsLatency}ms (high - check connection)`);
    }
    logger.info(`\u{1F4CA} Bot in ${client.guilds.cache.size} servers`);
  }
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split(".")[0]);
  if (majorVersion >= 18) {
    logger.info(`\u2705 Node.js ${nodeVersion} (supported)`);
  } else {
    logger.error(`\u274C Node.js ${nodeVersion} is too old. djs-helper-kit requires Node.js 18.17+`);
  }
  logger.info("\u{1F3AF} Diagnostics complete!");
}
function checkIntents(client, features, logger) {
  const requiredIntents = /* @__PURE__ */ new Set();
  for (const feature of features) {
    const featureIntents = FEATURE_INTENTS[feature];
    if (featureIntents) {
      featureIntents.forEach((intent) => requiredIntents.add(intent));
    }
  }
  const clientIntents = client.options.intents;
  const hasMessageContent = Array.isArray(clientIntents) ? clientIntents.includes(GatewayIntentBits.MessageContent) : clientIntents?.has(GatewayIntentBits.MessageContent);
  if (features.includes("messages")) {
    if (hasMessageContent) {
      logger.info("\u2705 Message Content intent enabled");
    } else {
      logger.error("\u274C Message Content intent missing. Required for reading message content.");
      logger.error("   Add it in Discord Developer Portal > Bot > Privileged Gateway Intents");
    }
  }
  if (features.includes("members")) {
    const hasMembers = Array.isArray(clientIntents) ? clientIntents.includes(GatewayIntentBits.GuildMembers) : clientIntents?.has(GatewayIntentBits.GuildMembers);
    if (hasMembers) {
      logger.info("\u2705 Guild Members intent enabled");
    } else {
      logger.error("\u274C Guild Members intent missing. Required for member-related features.");
      logger.error("   Enable it in Discord Developer Portal > Bot > Privileged Gateway Intents");
    }
  }
  logger.info(`\u{1F4CB} Features enabled: ${features.join(", ")}`);
}
function installErrorHandling(client, logger) {
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isRepliable()) return;
    logger.debug("Error handling installed for interaction");
  });
  client.on("error", (error) => {
    logger.error("Discord client error:", error);
  });
  client.on("warn", (warning) => {
    logger.warn("Discord client warning:", warning);
  });
}
function createDefaultLogger() {
  return {
    debug: (message, ...args) => console.debug(`[DEBUG] ${message}`, ...args),
    info: (message, ...args) => console.info(`[INFO] ${message}`, ...args),
    warn: (message, ...args) => console.warn(`[WARN] ${message}`, ...args),
    error: (message, ...args) => console.error(`[ERROR] ${message}`, ...args)
  };
}
function loadCommands(dirOrArray) {
  if (Array.isArray(dirOrArray)) {
    return dirOrArray;
  }
  console.warn("Directory loading not yet implemented. Use array format for now.");
  return [];
}
async function loadCommandsAsync(directory, logger) {
  const commands = [];
  try {
    const files = await readdir(directory);
    for (const file of files) {
      const filePath = join(directory, file);
      const stats = await stat(filePath);
      if (stats.isFile() && [".js", ".mjs"].includes(extname(file)) && !file.startsWith(".") && !file.includes("config") && !file.includes("test-") && file !== "index.js" && file !== "index.mjs") {
        try {
          logger?.debug(`Loading command from ${file}`);
          const fileUrl = pathToFileURL(filePath);
          const module = await import(fileUrl.href);
          const possibleCommands = [
            module.default,
            ...Object.values(module).filter(
              (exp) => exp && typeof exp === "object" && exp !== null && "data" in exp && "run" in exp
            )
          ].filter(Boolean);
          const validCommands = possibleCommands.filter((cmd) => {
            const command = cmd;
            const data = command.data;
            return command && command.data && typeof command.data === "object" && data.name && command.run && typeof command.run === "function";
          });
          commands.push(...validCommands);
        } catch (error) {
          logger?.error(`Failed to load command from ${file}:`, error);
        }
      }
    }
  } catch (error) {
    logger?.error(`Failed to read commands directory ${directory}:`, error);
  }
  return commands;
}
async function deploy(client, commands, options = {}) {
  const {
    scope = "guild",
    guildId,
    dryRun = false,
    confirm: confirm2 = false,
    logger = createDefaultLogger2()
  } = options;
  if (!client.token) {
    throw new Error("Client must be logged in with a token to deploy commands");
  }
  if (scope === "guild" && !guildId) {
    throw new Error("Guild ID is required for guild-scoped command deployment");
  }
  const rest = new REST({ version: "10" }).setToken(client.token);
  const clientId = client.user?.id || client.application?.id;
  if (!clientId) {
    throw new Error("Unable to determine client ID. Make sure the client is ready.");
  }
  const commandData = commands.map((cmd) => cmd.data.toJSON());
  logger.info(`\u{1F680} Deploying ${commandData.length} command(s) to ${scope}${scope === "guild" ? ` (${guildId})` : ""}`);
  try {
    const route = scope === "guild" ? Routes.applicationGuildCommands(clientId, guildId) : Routes.applicationCommands(clientId);
    const existingCommands = await rest.get(route);
    showCommandDiff(existingCommands, commandData, logger);
    if (dryRun) {
      logger.info("\u{1F50D} Dry run mode - no changes applied");
      return;
    }
    if (confirm2) {
      logger.info("\u26A0\uFE0F  Confirmation required - proceeding with deployment");
    }
    const deployedCommands = await rest.put(route, { body: commandData });
    logger.info(`\u2705 Successfully deployed ${deployedCommands.length} command(s)!`);
    if (scope === "global") {
      logger.warn("\u23F0 Global commands may take up to 1 hour to propagate across all servers");
    }
  } catch (error) {
    logger.error("\u274C Failed to deploy commands:", error);
    throw error;
  }
}
function showCommandDiff(existing, newCommands, logger) {
  const existingMap = new Map(existing.map((cmd) => [cmd.name, cmd]));
  const newMap = new Map(newCommands.map((cmd) => [cmd.name, cmd]));
  const toAdd = newCommands.filter((cmd) => !existingMap.has(cmd.name));
  const toUpdate = newCommands.filter((cmd) => {
    const existingCmd = existingMap.get(cmd.name);
    return existingCmd && !commandsEqual(existingCmd, cmd);
  });
  const toRemove = existing.filter((cmd) => !newMap.has(cmd.name));
  if (toAdd.length === 0 && toUpdate.length === 0 && toRemove.length === 0) {
    logger.info("\u{1F4CB} No changes detected - commands are up to date");
    return;
  }
  logger.info("\u{1F4CB} Command deployment summary:");
  if (toAdd.length > 0) {
    logger.info(`  \u2795 Adding ${toAdd.length} command(s):`);
    toAdd.forEach((cmd) => logger.info(`     - ${cmd.name}: ${cmd.description}`));
  }
  if (toUpdate.length > 0) {
    logger.info(`  \u{1F4DD} Updating ${toUpdate.length} command(s):`);
    toUpdate.forEach((cmd) => logger.info(`     - ${cmd.name}: ${cmd.description}`));
  }
  if (toRemove.length > 0) {
    logger.info(`  \u274C Removing ${toRemove.length} command(s):`);
    toRemove.forEach((cmd) => logger.info(`     - ${cmd.name}: ${cmd.description}`));
  }
}
function commandsEqual(cmd1, cmd2) {
  const c1 = cmd1;
  const c2 = cmd2;
  return c1.name === c2.name && c1.description === c2.description && JSON.stringify(c1.options || []) === JSON.stringify(c2.options || []);
}
function createDefaultLogger2() {
  return {
    debug: (message, ...args) => console.debug(`[DEBUG] ${message}`, ...args),
    info: (message, ...args) => console.info(`[INFO] ${message}`, ...args),
    warn: (message, ...args) => console.warn(`[WARN] ${message}`, ...args),
    error: (message, ...args) => console.error(`[ERROR] ${message}`, ...args)
  };
}
function createCommandHandler(commands, logger) {
  const commandMap = new Map(commands.map((cmd) => [cmd.data.name, cmd]));
  return async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const command = commandMap.get(interaction.commandName);
    if (!command) return;
    const context = { client: interaction.client, logger: logger || createDefaultLogger2() };
    try {
      if (command.guard) {
        const guardResult = await command.guard(interaction, context);
        if (guardResult !== true) {
          const errorMessage = typeof guardResult === "string" ? guardResult : "Access denied";
          await interaction.reply({
            content: errorMessage,
            ephemeral: true
          });
          return;
        }
      }
      await command.run(interaction, context);
    } catch (error) {
      context.logger.error(`Error in command ${interaction.commandName}:`, error);
      const errorMessage = "An error occurred while executing this command.";
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply(errorMessage);
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    }
  };
}
function createPrefixCommandHandler(prefixCommands, prefix = "!", logger) {
  const commandMap = /* @__PURE__ */ new Map();
  for (const cmd of prefixCommands) {
    commandMap.set(cmd.name, cmd);
    if (cmd.aliases) {
      for (const alias of cmd.aliases) {
        commandMap.set(alias, cmd);
      }
    }
  }
  return async (message) => {
    if (message.author.bot || !message.content.startsWith(prefix)) return;
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();
    if (!commandName) return;
    const command = commandMap.get(commandName);
    if (!command) return;
    const context = { client: message.client, logger: logger || createDefaultLogger2() };
    try {
      if (command.guard) {
        const guardResult = await command.guard(message, args, context);
        if (guardResult !== true) {
          const errorMessage = typeof guardResult === "string" ? guardResult : "Access denied";
          await message.reply(errorMessage);
          return;
        }
      }
      await command.run(message, args, context);
    } catch (error) {
      context.logger.error(`Error in prefix command ${commandName}:`, error);
      await message.reply("An error occurred while executing this command.");
    }
  };
}
function msg() {
  return new SimpleMessageImpl();
}
function embed() {
  return new SimpleEmbedImpl();
}
var modalV2 = {
  create(id, title, inputs) {
    const modal2 = new ModalBuilder().setCustomId(id).setTitle(title);
    inputs.forEach((input) => {
      const textInput = new TextInputBuilder().setCustomId(input.id).setLabel(input.label).setStyle(input.style || TextInputStyle.Short).setRequired(input.required !== false);
      if (input.placeholder) {
        textInput.setPlaceholder(input.placeholder);
      }
      if (input.minLength !== void 0) {
        textInput.setMinLength(input.minLength);
      }
      if (input.maxLength !== void 0) {
        textInput.setMaxLength(input.maxLength);
      }
      if (input.value) {
        textInput.setValue(input.value);
      }
      const actionRow = new ActionRowBuilder().addComponents(textInput);
      modal2.addComponents(actionRow);
    });
    return modal2;
  },
  contact(id) {
    return this.create(id, "Contact Form", [
      { id: "name", label: "Name", placeholder: "Enter your name", required: true },
      { id: "email", label: "Email", placeholder: "Enter your email", required: true },
      { id: "subject", label: "Subject", placeholder: "What is this about?", required: true },
      { id: "message", label: "Message", placeholder: "Tell us more...", required: true, style: TextInputStyle.Paragraph }
    ]);
  },
  feedback(id) {
    return this.create(id, "Feedback Form", [
      { id: "rating", label: "Rating (1-10)", placeholder: "Rate your experience", required: true },
      { id: "feedback", label: "Feedback", placeholder: "Share your thoughts...", required: true, style: TextInputStyle.Paragraph },
      { id: "suggestions", label: "Suggestions", placeholder: "Any suggestions for improvement?", style: TextInputStyle.Paragraph }
    ]);
  },
  settings(id, fields) {
    const inputs = fields.map((field) => ({
      id: field.toLowerCase().replace(/\s+/g, "_"),
      label: field,
      placeholder: `Enter ${field.toLowerCase()}`,
      required: true
    }));
    return this.create(id, "Settings", inputs);
  }
};
function createPagination(options) {
  const { items, itemsPerPage, currentPage = 1, showPageInfo = true, showNavigation = true } = options;
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = items.slice(startIndex, endIndex);
  const message = msg();
  if (showPageInfo) {
    message.text(`**Page ${currentPage} of ${totalPages}**`);
    message.text(`Showing ${startIndex + 1}-${Math.min(endIndex, items.length)} of ${items.length} items`);
    message.separator();
  }
  currentItems.forEach((item, index) => {
    if (typeof item === "string") {
      message.text(item);
    } else if (typeof item === "object" && item !== null && "title" in item && "description" in item) {
      const itemObj = item;
      message.title(itemObj.title);
      message.text(itemObj.description);
    } else {
      message.text(JSON.stringify(item));
    }
  });
  if (showNavigation && totalPages > 1) {
    const buttons = [];
    if (currentPage > 1) {
      buttons.push(btn.primary("page_first", "\u23EE\uFE0F First"));
      buttons.push(btn.secondary("page_prev", "\u25C0\uFE0F Previous"));
    }
    if (currentPage < totalPages) {
      buttons.push(btn.secondary("page_next", "Next \u25B6\uFE0F"));
      buttons.push(btn.primary("page_last", "Last \u23ED\uFE0F"));
    }
    if (buttons.length > 0) {
      message.buttons(...buttons);
    }
  }
  return message.build();
}
function createForm(fields) {
  return modalV2.create("form_" + Date.now(), "Form", fields);
}
var SimpleMessageImpl = class {
  textComponents = [];
  actionComponents = [];
  messageColor;
  hasContent = false;
  text(content) {
    this.textComponents.push(content);
    this.hasContent = true;
    return this;
  }
  title(text) {
    this.textComponents.push(`**${text}**`);
    this.hasContent = true;
    return this;
  }
  subtitle(text) {
    this.textComponents.push(`*${text}*`);
    this.hasContent = true;
    return this;
  }
  separator() {
    this.textComponents.push("---");
    return this;
  }
  smallSeparator() {
    this.textComponents.push("---");
    return this;
  }
  image(url, alt) {
    this.textComponents.push(`![${alt || "Image"}](${url})`);
    return this;
  }
  images(urls) {
    const imageText = urls.map((url) => `![Image](${url})`).join("\n");
    this.textComponents.push(imageText);
    return this;
  }
  mediaGallery(urls) {
    const galleryText = urls.map((url) => `![Gallery Image](${url})`).join("\n");
    this.textComponents.push(galleryText);
    return this;
  }
  thumbnail(url, alt) {
    this.textComponents.push(`![${alt || "Thumbnail"}](${url})`);
    return this;
  }
  field(name, value, inline = false) {
    const fieldText = inline ? `**${name}** ${value}` : `**${name}**
${value}`;
    this.textComponents.push(fieldText);
    this.hasContent = true;
    return this;
  }
  color(hex) {
    this.messageColor = hex;
    return this;
  }
  footer(text) {
    this.textComponents.push(`*${text}*`);
    this.hasContent = true;
    return this;
  }
  buttons(...buttons) {
    const row = new ActionRowBuilder();
    buttons.forEach((button) => row.addComponents(button));
    this.actionComponents.push(row.toJSON());
    return this;
  }
  select(menu) {
    const row = new ActionRowBuilder();
    row.addComponents(menu);
    this.actionComponents.push(row.toJSON());
    return this;
  }
  build() {
    const components = [];
    if (!this.hasContent) {
      this.textComponents.unshift(" ");
    }
    if (this.textComponents.length > 0) {
      const container = new ContainerBuilder();
      this.textComponents.forEach((text) => {
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(text)
        );
      });
      components.push(container.toJSON());
    }
    components.push(...this.actionComponents);
    return {
      components,
      flags: MessageFlags.IsComponentsV2
    };
  }
  reply() {
    return this.build();
  }
};
var SimpleEmbedImpl = class {
  textComponents = [];
  actionComponents = [];
  embedColor;
  embedTitle;
  embedDescription;
  fields = [];
  embedThumbnail;
  embedImage;
  embedFooter;
  embedTimestamp;
  title(text) {
    this.embedTitle = text;
    return this;
  }
  description(text) {
    this.embedDescription = text;
    return this;
  }
  color(hex) {
    this.embedColor = hex;
    return this;
  }
  field(name, value, inline = false) {
    this.fields.push({ name, value, inline });
    return this;
  }
  thumbnail(url) {
    this.embedThumbnail = url;
    return this;
  }
  image(url) {
    this.embedImage = url;
    return this;
  }
  footer(text) {
    this.embedFooter = text;
    return this;
  }
  timestamp(date) {
    this.embedTimestamp = date || /* @__PURE__ */ new Date();
    return this;
  }
  buttons(...buttons) {
    const row = new ActionRowBuilder();
    buttons.forEach((button) => row.addComponents(button));
    this.actionComponents.push(row.toJSON());
    return this;
  }
  select(menu) {
    const row = new ActionRowBuilder();
    row.addComponents(menu);
    this.actionComponents.push(row.toJSON());
    return this;
  }
  build() {
    const components = [];
    const container = new ContainerBuilder();
    if (this.embedTitle) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**${this.embedTitle}**`)
      );
    }
    if (this.embedDescription) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(this.embedDescription)
      );
    }
    if (this.fields.length > 0) {
      this.fields.forEach((field) => {
        const fieldText = field.inline ? `**${field.name}** ${field.value}` : `**${field.name}**
${field.value}`;
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(fieldText)
        );
      });
    }
    if (this.embedFooter) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`*${this.embedFooter}*`)
      );
    }
    if (this.embedTimestamp) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`<t:${Math.floor(this.embedTimestamp.getTime() / 1e3)}:R>`)
      );
    }
    components.push(container.toJSON());
    if (this.embedThumbnail) {
      const thumbContainer = new ContainerBuilder();
      thumbContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`![Thumbnail](${this.embedThumbnail})`)
      );
      components.push(thumbContainer.toJSON());
    }
    if (this.embedImage) {
      const imageContainer = new ContainerBuilder();
      imageContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`![Embed image](${this.embedImage})`)
      );
      components.push(imageContainer.toJSON());
    }
    components.push(...this.actionComponents);
    return {
      components,
      flags: MessageFlags.IsComponentsV2
    };
  }
};
var btn = {
  /**
   * Create a primary button
   * @param id - Custom ID for the button
   * @param label - Button label text
   * @returns ButtonBuilder configured as primary style
   */
  primary(id, label) {
    return new ButtonBuilder().setCustomId(id).setLabel(label).setStyle(ButtonStyle.Primary);
  },
  /**
   * Create a secondary button
   * @param id - Custom ID for the button
   * @param label - Button label text
   * @returns ButtonBuilder configured as secondary style
   */
  secondary(id, label) {
    return new ButtonBuilder().setCustomId(id).setLabel(label).setStyle(ButtonStyle.Secondary);
  },
  /**
   * Create a danger button
   * @param id - Custom ID for the button
   * @param label - Button label text
   * @returns ButtonBuilder configured as danger style
   */
  danger(id, label) {
    return new ButtonBuilder().setCustomId(id).setLabel(label).setStyle(ButtonStyle.Danger);
  },
  /**
   * Create a success button
   * @param id - Custom ID for the button
   * @param label - Button label text
   * @returns ButtonBuilder configured as success style
   */
  success(id, label) {
    return new ButtonBuilder().setCustomId(id).setLabel(label).setStyle(ButtonStyle.Success);
  },
  /**
   * Create a link button
   * @param url - URL for the button to link to
   * @param label - Button label text
   * @returns ButtonBuilder configured as link style
   */
  link(url, label) {
    return new ButtonBuilder().setURL(url).setLabel(label).setStyle(ButtonStyle.Link);
  }
};
var select = {
  /**
   * Create a string select menu
   * @param id - Custom ID for the menu
   * @param placeholder - Placeholder text
   * @param options - Array of options with label, value, and optional description
   * @returns StringSelectMenuBuilder
   */
  string(id, placeholder, options) {
    const menu = new StringSelectMenuBuilder().setCustomId(id).setPlaceholder(placeholder);
    options.forEach((option) => {
      const menuOption = new StringSelectMenuOptionBuilder().setLabel(option.label).setValue(option.value);
      if (option.description) {
        menuOption.setDescription(option.description);
      }
      menu.addOptions(menuOption);
    });
    return menu;
  },
  /**
   * Create a user select menu
   * @param id - Custom ID for the menu
   * @param placeholder - Placeholder text
   * @returns UserSelectMenuBuilder
   */
  user(id, placeholder) {
    return new UserSelectMenuBuilder().setCustomId(id).setPlaceholder(placeholder);
  },
  /**
   * Create a role select menu
   * @param id - Custom ID for the menu
   * @param placeholder - Placeholder text
   * @returns RoleSelectMenuBuilder
   */
  role(id, placeholder) {
    return new RoleSelectMenuBuilder().setCustomId(id).setPlaceholder(placeholder);
  },
  /**
   * Create a channel select menu
   * @param id - Custom ID for the menu
   * @param placeholder - Placeholder text
   * @returns ChannelSelectMenuBuilder
   */
  channel(id, placeholder) {
    return new ChannelSelectMenuBuilder().setCustomId(id).setPlaceholder(placeholder);
  }
};
function convertEmbed(embed2) {
  const embedObj = embed2;
  const builder = embedObj();
  const data = embedObj.data;
  if (data?.color) {
    builder.color(data.color);
  }
  if (data?.title) {
    builder.title(data.title);
  }
  if (data?.description) {
    builder.description(data.description);
  }
  if (data?.fields && Array.isArray(data.fields)) {
    for (const field of data.fields) {
      builder.field(field.name, field.value, field.inline);
    }
  }
  if (data?.thumbnail && typeof data.thumbnail === "object" && data.thumbnail !== null) {
    const thumbnail = data.thumbnail;
    if (thumbnail.url) {
      builder.thumbnail(thumbnail.url);
    }
  }
  if (data?.image && typeof data.image === "object" && data.image !== null) {
    const image = data.image;
    if (image.url) {
      builder.image(image.url);
    }
  }
  if (data?.footer && typeof data.footer === "object" && data.footer !== null) {
    const footer = data.footer;
    if (footer.text) {
      builder.footer(footer.text);
    }
  }
  if (data?.timestamp) {
    builder.timestamp(new Date(data.timestamp));
  }
  return builder;
}
function migrateEmbeds(embeds) {
  return embeds.map((embed2) => convertEmbed(embed2));
}
function needsMigration(message) {
  const messageObj = message;
  return Array.isArray(messageObj.embeds) && messageObj.embeds.length > 0;
}
function migrateMessage(message) {
  if (!needsMigration(message)) {
    return [];
  }
  const messageObj = message;
  const embeds = messageObj.embeds;
  return migrateEmbeds(embeds);
}
async function confirm(interaction, text, options = {}) {
  const {
    yesId = "confirm_yes",
    noId = "confirm_no",
    timeoutMs = 3e4,
    ephemeral = false,
    ui = (base) => base
  } = options;
  const baseCard = msg().text(`\u26A0\uFE0F **Confirmation Required**

${text}`);
  const confirmCard = ui(baseCard);
  const response = confirmCard.buttons(btn.danger(yesId, "Yes"), btn.secondary(noId, "No")).build();
  const flags = response.flags | (ephemeral ? MessageFlags.Ephemeral : 0);
  let message;
  if (interaction.replied || interaction.deferred) {
    const reply = await interaction.editReply({ components: response.components, flags });
    message = reply;
  } else {
    const reply = await interaction.reply({ components: response.components, flags, fetchReply: true });
    message = reply;
  }
  try {
    const buttonInteraction = await message.awaitMessageComponent({
      filter: (i) => [yesId, noId].includes(i.customId) && i.user.id === interaction.user.id,
      time: timeoutMs,
      componentType: ComponentType.Button
    });
    const confirmed = buttonInteraction.customId === yesId;
    const resultCard = msg().text(
      confirmed ? "\u2705 **Confirmed**\nAction will proceed." : "\u274C **Cancelled**\nNo action taken."
    );
    const resultResponse = resultCard.build();
    await buttonInteraction.update({ components: resultResponse.components });
    return confirmed;
  } catch {
    const timeoutCard = msg().text("\u23F0 **Timed out**\nNo response received.");
    try {
      const timeoutResponse = timeoutCard.build();
      await interaction.editReply({ components: timeoutResponse.components });
    } catch {
    }
    return false;
  }
}
async function paginate(interaction, items, options = {}) {
  const {
    perPage = 10,
    timeoutMs = 3e5,
    // 5 minutes
    ephemeral = false,
    render = defaultPaginateRender
  } = options;
  if (items.length === 0) {
    const emptyCard = msg().text("\u{1F4ED} **No items to display**");
    const response = emptyCard.build();
    response.flags = response.flags | (ephemeral ? MessageFlags.Ephemeral : 0);
    const responseData = response;
    await interaction.reply({ components: responseData.components, flags: responseData.flags });
    return;
  }
  const totalPages = Math.ceil(items.length / perPage);
  let currentPage = 0;
  const updatePage = async (pageIndex, targetInteraction) => {
    const startIndex = pageIndex * perPage;
    const endIndex = Math.min(startIndex + perPage, items.length);
    const pageItems = items.slice(startIndex, endIndex);
    const pageCard = render(pageItems, pageIndex + 1, totalPages);
    const actionRow = new ActionRowBuilder();
    if (totalPages > 1) {
      actionRow.addComponents(
        btn.secondary("page_first", "\u23EE\uFE0F").setDisabled(pageIndex === 0),
        btn.secondary("page_prev", "\u2B05\uFE0F").setDisabled(pageIndex === 0),
        btn.secondary("page_next", "\u27A1\uFE0F").setDisabled(pageIndex === totalPages - 1),
        btn.secondary("page_last", "\u23ED\uFE0F").setDisabled(pageIndex === totalPages - 1)
      );
    }
    const response = pageCard.buttons(...actionRow.components).build();
    response.flags = response.flags | (ephemeral ? MessageFlags.Ephemeral : 0);
    return await targetInteraction.update ? targetInteraction.update(response) : targetInteraction.reply({ ...response, fetchReply: true });
  };
  let message;
  if (interaction.replied || interaction.deferred) {
    message = await updatePage(currentPage, { update: interaction.editReply.bind(interaction) });
  } else {
    message = await updatePage(currentPage, interaction);
  }
  if (totalPages <= 1) return;
  const collector = message.createMessageComponentCollector({
    filter: (i) => i.user.id === interaction.user.id,
    time: timeoutMs,
    componentType: ComponentType.Button
  });
  collector.on("collect", async (buttonInteraction) => {
    switch (buttonInteraction.customId) {
      case "page_first":
        currentPage = 0;
        break;
      case "page_prev":
        currentPage = Math.max(0, currentPage - 1);
        break;
      case "page_next":
        currentPage = Math.min(totalPages - 1, currentPage + 1);
        break;
      case "page_last":
        currentPage = totalPages - 1;
        break;
    }
    await updatePage(currentPage, buttonInteraction);
  });
  collector.on("end", async () => {
    try {
      const timeoutCard = render(
        items.slice(currentPage * perPage, Math.min((currentPage + 1) * perPage, items.length)),
        currentPage + 1,
        totalPages
      );
      const timeoutResponse = timeoutCard.buttons().build();
      await interaction.editReply({ components: timeoutResponse.components });
    } catch {
    }
  });
}
async function collectButtons(message, options = {}) {
  const {
    filter = () => true,
    time = 3e4,
    max = 1
  } = options;
  return new Promise((resolve) => {
    const collected = [];
    const collector = message.createMessageComponentCollector({
      filter,
      time,
      max,
      componentType: ComponentType.Button
    });
    collector.on("collect", (interaction) => {
      collected.push(interaction);
    });
    collector.on("end", () => {
      resolve(collected);
    });
  });
}
function defaultPaginateRender(items, page, totalPages) {
  const content = items.join("\n") || "No items on this page";
  return msg().text(`\u{1F4C4} **Page ${page} of ${totalPages}**

${content}`).footer(`${items.length} items on this page`);
}
function modal(id, title, fields) {
  const modal2 = new ModalBuilder().setCustomId(id).setTitle(title);
  const actionRows = [];
  for (const field of fields) {
    const input = new TextInputBuilder().setCustomId(field.id).setLabel(field.label).setStyle(field.style === "paragraph" ? TextInputStyle.Paragraph : TextInputStyle.Short).setRequired(field.required ?? false);
    if (field.maxLength) {
      input.setMaxLength(field.maxLength);
    }
    if (field.placeholder) {
      input.setPlaceholder(field.placeholder);
    }
    if (field.value) {
      input.setValue(field.value);
    }
    const actionRow = new ActionRowBuilder().addComponents(input);
    actionRows.push(actionRow);
  }
  return modal2.addComponents(actionRows);
}
async function awaitModal(interaction, modal2, timeoutMs = 3e5) {
  await interaction.showModal(modal2);
  try {
    const modalInteraction = await interaction.awaitModalSubmit({
      filter: (i) => i.customId === modal2.data.custom_id && i.user.id === interaction.user.id,
      time: timeoutMs
    });
    const data = {};
    for (const component of modalInteraction.components) {
      if (component.components[0]?.type === ComponentType.TextInput) {
        const input = component.components[0];
        data[input.customId] = input.value;
      }
    }
    return data;
  } catch {
    throw new Error("Modal submission timed out or was cancelled");
  }
}

// src/rest/index.ts
function wrapRest(rest, options = {}) {
  const {
    maxRetries = 3,
    baseDelayMs = 1e3,
    logger = createDefaultLogger3()
  } = options;
  const originalPost = rest.post.bind(rest);
  const originalPatch = rest.patch.bind(rest);
  const originalDelete = rest.delete.bind(rest);
  rest.post = async (route, options2) => {
    return await retryWithBackoff(
      () => originalPost(route, options2),
      maxRetries,
      baseDelayMs,
      logger,
      "POST"
    );
  };
  rest.patch = async (route, options2) => {
    return await retryWithBackoff(
      () => originalPatch(route, options2),
      maxRetries,
      baseDelayMs,
      logger,
      "PATCH"
    );
  };
  rest.delete = async (route, options2) => {
    return await retryWithBackoff(
      () => originalDelete(route, options2),
      maxRetries,
      baseDelayMs,
      logger,
      "DELETE"
    );
  };
  return rest;
}
async function retryWithBackoff(fn, maxRetries, baseDelayMs, logger, method) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const errorObj = error;
      if (typeof errorObj.code === "number" && errorObj.code >= 400 && errorObj.code < 500 && errorObj.code !== 429) {
        throw error;
      }
      if (attempt === maxRetries) {
        logger.error(`Failed ${method} request after ${maxRetries} retries:`, error);
        throw error;
      }
      const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * 250;
      logger.warn(`${method} request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}
function createDefaultLogger3() {
  return {
    debug: (message, ...args) => console.debug(`[REST] ${message}`, ...args),
    info: (message, ...args) => console.info(`[REST] ${message}`, ...args),
    warn: (message, ...args) => console.warn(`[REST] ${message}`, ...args),
    error: (message, ...args) => console.error(`[REST] ${message}`, ...args)
  };
}

// src/perms/index.ts
function hasPerm(_member, _perm) {
  return true;
}
async function requireGuildAdmin(_interaction) {
  console.warn("requireGuildAdmin not yet implemented - coming in v0.2");
  return false;
}
async function canSend(_channel) {
  return true;
}
function autoShard(token, options = {}) {
  const {
    totalShards = "auto",
    respawn = true,
    logger = createDefaultLogger4()
  } = options;
  const manager = new ShardingManager("./dist/bot.js", {
    token,
    totalShards,
    respawn
  });
  manager.on("shardCreate", (shard) => {
    logger.info(`Launched shard ${shard.id}`);
  });
  return manager;
}
async function shardHealth(client) {
  const shardInfo = {
    id: 0,
    status: client.ws.status.toString(),
    guilds: client.guilds.cache.size,
    ping: client.ws.ping,
    uptime: client.uptime || 0
  };
  return {
    total: 1,
    online: shardInfo.status === "ready" ? 1 : 0,
    offline: shardInfo.status === "ready" ? 0 : 1,
    shards: [shardInfo],
    averagePing: shardInfo.ping,
    totalGuilds: shardInfo.guilds
  };
}
async function broadcastToShards(client, message) {
  client.emit("broadcast", message);
  return [true];
}
async function getTotalGuildCount(client) {
  const health = await shardHealth(client);
  return health.totalGuilds;
}
function createDefaultLogger4() {
  return {
    debug: (message, ...args) => console.debug(`[SHARD] ${message}`, ...args),
    info: (message, ...args) => console.info(`[SHARD] ${message}`, ...args),
    warn: (message, ...args) => console.warn(`[SHARD] ${message}`, ...args),
    error: (message, ...args) => console.error(`[SHARD] ${message}`, ...args)
  };
}

// src/cache/index.ts
async function getMessageSafe(client, channelId, messageId) {
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel?.isTextBased()) return null;
    const message = await channel.messages.fetch(messageId);
    return message;
  } catch {
    return null;
  }
}
async function ensureGuildMember(client, guildId, userId) {
  try {
    const guild = await client.guilds.fetch(guildId);
    const member = await guild.members.fetch(userId);
    return member;
  } catch {
    return null;
  }
}
function memoryCache() {
  const store = /* @__PURE__ */ new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.expires > 0 && entry.expires < now) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1e3);
  return {
    async get(key) {
      const entry = store.get(key);
      if (!entry) return null;
      if (entry.expires > 0 && entry.expires < Date.now()) {
        store.delete(key);
        return null;
      }
      return entry.value;
    },
    async set(key, value, ttlSeconds) {
      const expires = ttlSeconds ? Date.now() + ttlSeconds * 1e3 : 0;
      store.set(key, { value, expires });
    },
    async del(key) {
      store.delete(key);
    }
  };
}
function redisCache(_url) {
  console.warn('Redis cache adapter requires Redis client. Install "redis" or "ioredis" package.');
  return {
    async get() {
      return null;
    },
    async set() {
    },
    async del() {
    }
  };
}

// src/i18n/index.ts
function createI18n(locales, options = {}) {
  const {
    defaultLocale = "en",
    fallbackLocale = "en",
    logger = createDefaultLogger5()
  } = options;
  let currentLocale = defaultLocale;
  function interpolate(text, params = {}) {
    return text.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key]?.toString() || match;
    });
  }
  function getTranslation(key, locale = currentLocale) {
    const localeData = locales[locale];
    if (!localeData) {
      logger.warn(`Locale '${locale}' not found, falling back to '${fallbackLocale}'`);
      return locales[fallbackLocale]?.[key] || null;
    }
    return localeData[key] || null;
  }
  return {
    t(key, locale, params) {
      const translation = getTranslation(key, locale);
      if (!translation) {
        logger.warn(`Translation key '${key}' not found for locale '${locale || currentLocale}'`);
        return key;
      }
      return interpolate(translation, params);
    },
    get locale() {
      return currentLocale;
    },
    setLocale(locale) {
      if (locales[locale]) {
        currentLocale = locale;
        logger.info(`Locale set to '${locale}'`);
      } else {
        logger.warn(`Locale '${locale}' not found, keeping current locale '${currentLocale}'`);
      }
    },
    has(key, locale) {
      return getTranslation(key, locale) !== null;
    }
  };
}
function getUserLocale(_user) {
  return "en";
}
function formatNumber(number, locale = "en") {
  return new Intl.NumberFormat(locale).format(number);
}
function formatDate(date, locale = "en", options) {
  return new Intl.DateTimeFormat(locale, options).format(date);
}
function createDefaultLogger5() {
  return {
    debug: (message, ...args) => console.debug(`[I18N] ${message}`, ...args),
    info: (message, ...args) => console.info(`[I18N] ${message}`, ...args),
    warn: (message, ...args) => console.warn(`[I18N] ${message}`, ...args),
    error: (message, ...args) => console.error(`[I18N] ${message}`, ...args)
  };
}

// src/errors/index.ts
var EasierError = class extends Error {
  code;
  cause;
  constructor(message, code, cause) {
    super(message);
    this.name = "EasierError";
    if (code !== void 0) {
      this.code = code;
    }
    this.cause = cause;
  }
};
var CommandValidationError = class extends EasierError {
  constructor(message, cause) {
    super(message, "COMMAND_VALIDATION_ERROR", cause);
    this.name = "CommandValidationError";
  }
};
var PermissionError = class extends EasierError {
  constructor(message, cause) {
    super(message, "PERMISSION_ERROR", cause);
    this.name = "PermissionError";
  }
};
var RateLimitError = class extends EasierError {
  constructor(message, retryAfter, cause) {
    super(message, "RATE_LIMIT_ERROR", cause);
    this.name = "RateLimitError";
    if (retryAfter !== void 0) {
      this.retryAfter = retryAfter;
    }
  }
};
function installInteractionErrorHandler(client, logger) {
  const log = logger || createDefaultLogger6();
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isRepliable()) return;
    const originalReply = interaction.reply.bind(interaction);
    const originalFollowUp = interaction.followUp.bind(interaction);
    const originalEditReply = interaction.editReply.bind(interaction);
    interaction.reply = wrapWithErrorHandling(originalReply, interaction, log);
    interaction.followUp = wrapWithErrorHandling(originalFollowUp, interaction, log);
    interaction.editReply = wrapWithErrorHandling(originalEditReply, interaction, log);
  });
  client.on("error", (error) => {
    log.error("Discord client error:", error);
  });
  client.on("warn", (warning) => {
    log.warn("Discord client warning:", warning);
  });
  log.info("\u2705 Interaction error handler installed");
}
function wrapWithErrorHandling(originalMethod, interaction, logger) {
  return async (...args) => {
    try {
      return await originalMethod(...args);
    } catch (error) {
      await handleInteractionError(error, interaction, logger);
      throw error;
    }
  };
}
async function handleInteractionError(error, interaction, logger) {
  const redactedError = redactSensitiveInfo(error);
  const interactionObj = interaction;
  const userId = interactionObj.user && typeof interactionObj.user === "object" && interactionObj.user !== null ? interactionObj.user.id : "unknown";
  logger.error(`Interaction error for user ${userId}:`, redactedError);
  let userMessage = "Something went wrong while processing your request.";
  if (error instanceof EasierError) {
    switch (error.code) {
      case "PERMISSION_ERROR":
        userMessage = "You don't have permission to use this command.";
        break;
      case "RATE_LIMIT_ERROR":
        userMessage = "You're doing that too fast. Please try again later.";
        break;
      case "COMMAND_VALIDATION_ERROR":
        userMessage = "Invalid command input. Please check your parameters.";
        break;
    }
  }
  try {
    const interactionObj2 = interaction;
    if (interactionObj2.replied || interactionObj2.deferred) {
      await interactionObj2.editReply({ content: userMessage, ephemeral: true });
    } else {
      await interactionObj2.reply({ content: userMessage, ephemeral: true });
    }
  } catch (replyError) {
    logger.error("Failed to send error message to user:", replyError);
  }
}
function redactSensitiveInfo(error) {
  if (error instanceof Error) {
    const redactedError = { ...error };
    if (redactedError.message) {
      redactedError.message = redactedError.message.replace(/Bot\s+[A-Za-z0-9._-]{59}/g, "Bot [REDACTED]").replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [REDACTED]").replace(/\d{17,19}/g, "[SNOWFLAKE_REDACTED]");
    }
    if (redactedError.stack) {
      redactedError.stack = redactedError.stack.replace(/Bot\s+[A-Za-z0-9._-]{59}/g, "Bot [REDACTED]").replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [REDACTED]").replace(/\d{17,19}/g, "[SNOWFLAKE_REDACTED]");
    }
    return redactedError;
  }
  return error;
}
function createLogger(options = {}) {
  const { level = "info", redact = ["token", "password", "secret", "key"] } = options;
  const levels = ["debug", "info", "warn", "error"];
  const currentLevelIndex = levels.indexOf(level);
  const shouldLog = (messageLevel) => {
    return levels.indexOf(messageLevel) >= currentLevelIndex;
  };
  const redactMessage = (message, ...args) => {
    let redactedMessage = message;
    const redactedArgs = args.map((arg) => {
      if (typeof arg === "string") {
        let redacted = arg;
        redact.forEach((pattern) => {
          const regex = new RegExp(pattern, "gi");
          redacted = redacted.replace(regex, "[REDACTED]");
        });
        return redacted;
      }
      return arg;
    });
    redact.forEach((pattern) => {
      const regex = new RegExp(pattern, "gi");
      redactedMessage = redactedMessage.replace(regex, "[REDACTED]");
    });
    return { message: redactedMessage, args: redactedArgs };
  };
  return {
    debug: (message, ...args) => {
      if (shouldLog("debug")) {
        const { message: msg2, args: redactedArgs } = redactMessage(message, ...args);
        console.debug(`[DEBUG] ${msg2}`, ...redactedArgs);
      }
    },
    info: (message, ...args) => {
      if (shouldLog("info")) {
        const { message: msg2, args: redactedArgs } = redactMessage(message, ...args);
        console.info(`[INFO] ${msg2}`, ...redactedArgs);
      }
    },
    warn: (message, ...args) => {
      if (shouldLog("warn")) {
        const { message: msg2, args: redactedArgs } = redactMessage(message, ...args);
        console.warn(`[WARN] ${msg2}`, ...redactedArgs);
      }
    },
    error: (message, ...args) => {
      if (shouldLog("error")) {
        const { message: msg2, args: redactedArgs } = redactMessage(message, ...args);
        console.error(`[ERROR] ${msg2}`, ...redactedArgs);
      }
    }
  };
}
function createDefaultLogger6() {
  return {
    debug: (message, ...args) => console.debug(`[DEBUG] ${message}`, ...args),
    info: (message, ...args) => console.info(`[INFO] ${message}`, ...args),
    warn: (message, ...args) => console.warn(`[WARN] ${message}`, ...args),
    error: (message, ...args) => console.error(`[ERROR] ${message}`, ...args)
  };
}

export { CommandValidationError, EasierError, PermissionError, RateLimitError, autoShard, awaitModal, broadcastToShards, btn, canSend, collectButtons, confirm, convertEmbed, createClient, createCommandHandler, createForm, createI18n, createLogger, createPagination, createPrefixCommandHandler, deploy, diagnose, embed, ensureGuildMember, formatDate, formatNumber, getMessageSafe, getTotalGuildCount, getUserLocale, hasPerm, installInteractionErrorHandler, loadCommands, loadCommandsAsync, memoryCache, migrateEmbeds, migrateMessage, modal, modalV2, msg, needsMigration, paginate, redisCache, requireGuildAdmin, select, shardHealth, wrapRest };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map