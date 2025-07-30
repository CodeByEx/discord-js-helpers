'use strict';

var discord_js = require('discord.js');
var promises = require('fs/promises');
var path = require('path');

// easier-djs - Discord.js helpers with zero config

var FEATURE_INTENTS = {
  commands: [],
  messages: [discord_js.GatewayIntentBits.MessageContent, discord_js.GatewayIntentBits.GuildMessages],
  members: [discord_js.GatewayIntentBits.GuildMembers],
  reactions: [discord_js.GatewayIntentBits.GuildMessageReactions],
  voice: [discord_js.GatewayIntentBits.GuildVoiceStates],
  v2: [],
  // V2 components don't need special intents
  diagnostics: [discord_js.GatewayIntentBits.Guilds]
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
  intents.add(discord_js.GatewayIntentBits.Guilds);
  for (const feature of features) {
    const featureIntents = FEATURE_INTENTS[feature];
    if (featureIntents) {
      featureIntents.forEach((intent) => intents.add(intent));
    } else {
      logger.warn(`Unknown feature: ${feature}`);
    }
  }
  additionalIntents.forEach((intent) => intents.add(intent));
  const client = new discord_js.Client({
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
  logger.info("\u{1F50D} Running easier-djs diagnostics...");
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
    logger.error(`\u274C Node.js ${nodeVersion} is too old. easier-djs requires Node.js 18.17+`);
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
  const hasMessageContent = Array.isArray(clientIntents) ? clientIntents.includes(discord_js.GatewayIntentBits.MessageContent) : clientIntents?.has(discord_js.GatewayIntentBits.MessageContent);
  if (features.includes("messages")) {
    if (hasMessageContent) {
      logger.info("\u2705 Message Content intent enabled");
    } else {
      logger.error("\u274C Message Content intent missing. Required for reading message content.");
      logger.error("   Add it in Discord Developer Portal > Bot > Privileged Gateway Intents");
    }
  }
  if (features.includes("members")) {
    const hasMembers = Array.isArray(clientIntents) ? clientIntents.includes(discord_js.GatewayIntentBits.GuildMembers) : clientIntents?.has(discord_js.GatewayIntentBits.GuildMembers);
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
    const files = await promises.readdir(directory);
    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = await promises.stat(filePath);
      if (stats.isFile() && [".js", ".ts", ".mjs"].includes(path.extname(file))) {
        try {
          logger?.debug(`Loading command from ${file}`);
          const module = await import(filePath);
          const possibleCommands = [
            module.default,
            ...Object.values(module).filter(
              (exp) => exp && typeof exp === "object" && exp.data && exp.run
            )
          ].filter(Boolean);
          commands.push(...possibleCommands);
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
  const rest = new discord_js.REST({ version: "10" }).setToken(client.token);
  const clientId = client.user?.id || client.application?.id;
  if (!clientId) {
    throw new Error("Unable to determine client ID. Make sure the client is ready.");
  }
  const commandData = commands.map((cmd) => cmd.data.toJSON());
  logger.info(`\u{1F680} Deploying ${commandData.length} command(s) to ${scope}${scope === "guild" ? ` (${guildId})` : ""}`);
  try {
    const route = scope === "guild" ? discord_js.Routes.applicationGuildCommands(clientId, guildId) : discord_js.Routes.applicationCommands(clientId);
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
  return cmd1.name === cmd2.name && cmd1.description === cmd2.description && JSON.stringify(cmd1.options || []) === JSON.stringify(cmd2.options || []);
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
function card() {
  return new CardBuilderImpl();
}
var CardBuilderImpl = class {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _color;
  _sections = [];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _thumbUrl;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _imageUrl;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _footerText;
  color(hex) {
    this._color = hex;
    return this;
  }
  section(md) {
    this._sections.push(md);
    return this;
  }
  thumb(url) {
    this._thumbUrl = url;
    return this;
  }
  image(url) {
    this._imageUrl = url;
    return this;
  }
  footer(md) {
    this._footerText = md;
    return this;
  }
  toComponent() {
    return {
      type: discord_js.ComponentType.ActionRow,
      components: []
    };
  }
  withActions(...rows) {
    return {
      components: rows,
      flags: discord_js.MessageFlags.IsComponentsV2
    };
  }
};
var btn = {
  /**
   * Create a primary (blurple) button
   * @param id - Custom ID for the button
   * @param label - Button label text
   * @returns ButtonBuilder configured as primary style
   */
  primary(id, label) {
    return new discord_js.ButtonBuilder().setCustomId(id).setLabel(label).setStyle(discord_js.ButtonStyle.Primary);
  },
  /**
   * Create a secondary (grey) button
   * @param id - Custom ID for the button
   * @param label - Button label text
   * @returns ButtonBuilder configured as secondary style
   */
  secondary(id, label) {
    return new discord_js.ButtonBuilder().setCustomId(id).setLabel(label).setStyle(discord_js.ButtonStyle.Secondary);
  },
  /**
   * Create a danger (red) button
   * @param id - Custom ID for the button
   * @param label - Button label text
   * @returns ButtonBuilder configured as danger style
   */
  danger(id, label) {
    return new discord_js.ButtonBuilder().setCustomId(id).setLabel(label).setStyle(discord_js.ButtonStyle.Danger);
  },
  /**
   * Create a link button (opens URL)
   * @param url - URL to open when clicked
   * @param label - Button label text
   * @returns ButtonBuilder configured as link style
   */
  link(url, label) {
    return new discord_js.ButtonBuilder().setURL(url).setLabel(label).setStyle(discord_js.ButtonStyle.Link);
  }
};
function convertEmbed(embed) {
  const builder = card();
  if (embed.data?.color) {
    builder.color(embed.data.color);
  }
  if (embed.data?.description) {
    builder.section(embed.data.description);
  }
  if (embed.data?.thumbnail?.url) {
    builder.thumb(embed.data.thumbnail.url);
  }
  if (embed.data?.image?.url) {
    builder.image(embed.data.image.url);
  }
  if (embed.data?.footer?.text) {
    builder.footer(embed.data.footer.text);
  }
  return builder;
}
async function confirm(interaction, text, options = {}) {
  const {
    yesId = "confirm_yes",
    noId = "confirm_no",
    timeoutMs = 3e4,
    ephemeral = false,
    ui = (base) => base
  } = options;
  const baseCard = card().section(`\u26A0\uFE0F **Confirmation Required**

${text}`);
  const confirmCard = ui(baseCard);
  const actionRow = new discord_js.ActionRowBuilder().addComponents(
    btn.danger(yesId, "Yes"),
    btn.secondary(noId, "No")
  );
  const response = confirmCard.withActions(actionRow);
  const flags = response.flags | (ephemeral ? discord_js.MessageFlags.Ephemeral : 0);
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
      componentType: discord_js.ComponentType.Button
    });
    const confirmed = buttonInteraction.customId === yesId;
    const resultCard = card().section(
      confirmed ? "\u2705 **Confirmed**\nAction will proceed." : "\u274C **Cancelled**\nNo action taken."
    );
    const resultResponse = resultCard.withActions();
    await buttonInteraction.update({ components: resultResponse.components });
    return confirmed;
  } catch (error) {
    const timeoutCard = card().section("\u23F0 **Timed out**\nNo response received.");
    try {
      const timeoutResponse = timeoutCard.withActions();
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
    const emptyCard = card().section("\u{1F4ED} **No items to display**");
    const response = emptyCard.withActions();
    response.flags = response.flags | (ephemeral ? discord_js.MessageFlags.Ephemeral : 0);
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
    const actionRow = new discord_js.ActionRowBuilder();
    if (totalPages > 1) {
      actionRow.addComponents(
        btn.secondary("page_first", "\u23EE\uFE0F").setDisabled(pageIndex === 0),
        btn.secondary("page_prev", "\u2B05\uFE0F").setDisabled(pageIndex === 0),
        btn.secondary("page_next", "\u27A1\uFE0F").setDisabled(pageIndex === totalPages - 1),
        btn.secondary("page_last", "\u23ED\uFE0F").setDisabled(pageIndex === totalPages - 1)
      );
    }
    const response = pageCard.withActions(actionRow);
    response.flags = response.flags | (ephemeral ? discord_js.MessageFlags.Ephemeral : 0);
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
    componentType: discord_js.ComponentType.Button
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
      const timeoutResponse = timeoutCard.withActions();
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
      componentType: discord_js.ComponentType.Button
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
  return card().section(`\u{1F4C4} **Page ${page} of ${totalPages}**

${content}`).footer(`${items.length} items on this page`);
}
function modal(id, title, fields) {
  const modal2 = new discord_js.ModalBuilder().setCustomId(id).setTitle(title);
  const actionRows = [];
  for (const field of fields) {
    const input = new discord_js.TextInputBuilder().setCustomId(field.id).setLabel(field.label).setStyle(field.style === "paragraph" ? discord_js.TextInputStyle.Paragraph : discord_js.TextInputStyle.Short).setRequired(field.required ?? false);
    if (field.maxLength) {
      input.setMaxLength(field.maxLength);
    }
    if (field.placeholder) {
      input.setPlaceholder(field.placeholder);
    }
    if (field.value) {
      input.setValue(field.value);
    }
    const actionRow = new discord_js.ActionRowBuilder().addComponents(input);
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
      if (component.components[0]?.type === discord_js.ComponentType.TextInput) {
        const input = component.components[0];
        data[input.customId] = input.value;
      }
    }
    return data;
  } catch (error) {
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
      if (error.code >= 400 && error.code < 500 && error.code !== 429) {
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
function hasPerm(member, perm) {
  console.warn("hasPerm not yet implemented - coming in v0.2");
  return false;
}
async function requireGuildAdmin(interaction) {
  console.warn("requireGuildAdmin not yet implemented - coming in v0.2");
  return false;
}
async function canSend(channel) {
  console.warn("canSend not yet implemented - coming in v0.2");
  return false;
}

// src/shards/index.ts
function autoShard(entry, opts) {
  console.warn("autoShard not yet implemented - coming in v0.3");
  return null;
}
async function shardHealth(manager) {
  console.warn("shardHealth not yet implemented - coming in v0.3");
  return { ok: false, details: {} };
}

// src/cache/index.ts
async function getMessageSafe(client, channelId, messageId) {
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel?.isTextBased()) return null;
    const message = await channel.messages.fetch(messageId);
    return message;
  } catch (error) {
    return null;
  }
}
async function ensureGuildMember(client, guildId, userId) {
  try {
    const guild = await client.guilds.fetch(guildId);
    const member = await guild.members.fetch(userId);
    return member;
  } catch (error) {
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
function redisCache(url) {
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
function createI18n(dict) {
  console.warn("createI18n not yet implemented - coming in v0.3");
  return (i, key, vars) => {
    return key;
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
    this.retryAfter = retryAfter;
  }
};
function installInteractionErrorHandler(client, logger) {
  const log = logger || createDefaultLogger4();
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
  logger.error(`Interaction error for user ${interaction.user.id}:`, redactedError);
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
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({ content: userMessage, ephemeral: true });
    } else {
      await interaction.reply({ content: userMessage, ephemeral: true });
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
        const { message: msg, args: redactedArgs } = redactMessage(message, ...args);
        console.debug(`[DEBUG] ${msg}`, ...redactedArgs);
      }
    },
    info: (message, ...args) => {
      if (shouldLog("info")) {
        const { message: msg, args: redactedArgs } = redactMessage(message, ...args);
        console.info(`[INFO] ${msg}`, ...redactedArgs);
      }
    },
    warn: (message, ...args) => {
      if (shouldLog("warn")) {
        const { message: msg, args: redactedArgs } = redactMessage(message, ...args);
        console.warn(`[WARN] ${msg}`, ...redactedArgs);
      }
    },
    error: (message, ...args) => {
      if (shouldLog("error")) {
        const { message: msg, args: redactedArgs } = redactMessage(message, ...args);
        console.error(`[ERROR] ${msg}`, ...redactedArgs);
      }
    }
  };
}
function createDefaultLogger4() {
  return {
    debug: (message, ...args) => console.debug(`[DEBUG] ${message}`, ...args),
    info: (message, ...args) => console.info(`[INFO] ${message}`, ...args),
    warn: (message, ...args) => console.warn(`[WARN] ${message}`, ...args),
    error: (message, ...args) => console.error(`[ERROR] ${message}`, ...args)
  };
}

exports.CommandValidationError = CommandValidationError;
exports.EasierError = EasierError;
exports.PermissionError = PermissionError;
exports.RateLimitError = RateLimitError;
exports.autoShard = autoShard;
exports.awaitModal = awaitModal;
exports.btn = btn;
exports.canSend = canSend;
exports.card = card;
exports.collectButtons = collectButtons;
exports.confirm = confirm;
exports.convertEmbed = convertEmbed;
exports.createClient = createClient;
exports.createCommandHandler = createCommandHandler;
exports.createI18n = createI18n;
exports.createLogger = createLogger;
exports.createPrefixCommandHandler = createPrefixCommandHandler;
exports.deploy = deploy;
exports.diagnose = diagnose;
exports.ensureGuildMember = ensureGuildMember;
exports.getMessageSafe = getMessageSafe;
exports.hasPerm = hasPerm;
exports.installInteractionErrorHandler = installInteractionErrorHandler;
exports.loadCommands = loadCommands;
exports.loadCommandsAsync = loadCommandsAsync;
exports.memoryCache = memoryCache;
exports.modal = modal;
exports.paginate = paginate;
exports.redisCache = redisCache;
exports.requireGuildAdmin = requireGuildAdmin;
exports.shardHealth = shardHealth;
exports.wrapRest = wrapRest;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map