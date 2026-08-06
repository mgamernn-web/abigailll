const {
  SlashCommandBuilder,
  MessageFlags,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');

const MAX_HIGHLIGHTS = 10;

function getHighlightMap(client) {
  if (!client.highlights) client.highlights = new Map();
  return client.highlights;
}

function getUserHighlights(client, userId, guildId) {
  const map = getHighlightMap(client);
  const key = `${guildId}-${userId}`;
  if (!map.has(key)) map.set(key, []);
  return map.get(key);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hl')
    .setDescription('🔔 Set highlight keywords — get DM when someone mentions them')
    .addSubcommand(sub =>
      sub
        .setName('add')
        .setDescription('Add a highlight keyword for yourself or another user (max 10)')
        .addStringOption(opt =>
          opt.setName('keyword').setDescription('The keyword to highlight').setRequired(true).setMaxLength(30),
        )
        .addUserOption(opt =>
          opt.setName('user').setDescription('Target user (optional — defaults to you)'),
        ),
    )
    .addSubcommand(sub =>
      sub
        .setName('remove')
        .setDescription('Remove a highlight keyword from yourself or another user')
        .addStringOption(opt =>
          opt.setName('keyword').setDescription('The keyword to remove').setRequired(true),
        )
        .addUserOption(opt =>
          opt.setName('user').setDescription('Target user (optional — defaults to you)'),
        ),
    )
    .addSubcommand(sub =>
      sub
        .setName('list')
        .setDescription('Show highlights (yours or another user\'s)')
        .addUserOption(opt =>
          opt.setName('user').setDescription('Target user (optional — defaults to you)'),
        ),
    )
    .addSubcommand(sub =>
      sub.setName('clear').setDescription('Remove all YOUR highlight keywords'),
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    // For add/remove/list — support targeting another user
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const userId = targetUser.id;
    const userTag = targetUser.tag;
    const isForOther = targetUser.id !== interaction.user.id;

    const highlights = getUserHighlights(interaction.client, userId, guildId);

    switch (sub) {
      case 'add': {
        const keyword = interaction.options.getString('keyword').toLowerCase().trim();

        if (keyword.length < 2) {
          return interaction.reply({ content: '❌ Keyword must be at least 2 characters.', flags: MessageFlags.Ephemeral });
        }

        if (highlights.length >= MAX_HIGHLIGHTS) {
          return interaction.reply({
            content: `❌ **${userTag}** already has **${MAX_HIGHLIGHTS}** highlights! Remove one first with \`/hl remove\`.`,
            flags: MessageFlags.Ephemeral,
          });
        }

        if (highlights.includes(keyword)) {
          return interaction.reply({ content: `❌ "${keyword}" is already in **${userTag}'s** highlights!`, flags: MessageFlags.Ephemeral });
        }

        highlights.push(keyword);

        const forLabel = isForOther ? `for **${userTag}**` : '';
        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle('✅ Highlight Added!')
          .setDescription(`Keyword **"${keyword}"** is now being monitored ${forLabel}.`)
          .addFields(
            { name: '📌 Keyword', value: keyword, inline: true },
            { name: '👤 User', value: userTag, inline: true },
            { name: '📊 Count', value: `${highlights.length}/${MAX_HIGHLIGHTS}`, inline: true },
            { name: '💡 Tip', value: `${userTag} will get a DM when someone mentions this keyword.`, inline: true },
          )
          .setFooter({ text: 'Abigail 💕 — Highlights' })
          .setTimestamp();

        return interaction.reply({ embeds: [embed] });
      }

      case 'remove': {
        const keyword = interaction.options.getString('keyword').toLowerCase().trim();
        const idx = highlights.indexOf(keyword);

        if (idx === -1) {
          return interaction.reply({ content: `❌ "${keyword}" is not in **${userTag}'s** highlights!`, flags: MessageFlags.Ephemeral });
        }

        highlights.splice(idx, 1);

        const embed = new EmbedBuilder()
          .setColor(0xED4245)
          .setTitle('🗑️ Highlight Removed')
          .setDescription(`Keyword **"${keyword}"** removed from **${userTag}'s** highlights.`)
          .addFields(
            { name: '👤 User', value: userTag, inline: true },
            { name: '📊 Remaining', value: `${highlights.length}/${MAX_HIGHLIGHTS}`, inline: true },
          )
          .setFooter({ text: 'Abigail 💕 — Highlights' })
          .setTimestamp();

        return interaction.reply({ embeds: [embed] });
      }

      case 'list': {
        if (highlights.length === 0) {
          return interaction.reply({
            embeds: [new EmbedBuilder()
              .setColor(0x2C2F33)
              .setTitle(`🔔 ${userTag}'s Highlights`)
              .setDescription('No highlights set. Use `/hl add <keyword>` to add one!')
              .setFooter({ text: `Abigail 💕 — 0/${MAX_HIGHLIGHTS}` })
              .setTimestamp()],
          });
        }

        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle(`🔔 ${userTag}'s Highlights`)
          .setDescription(highlights.map((h, i) => `\`${i + 1}.\` **${h}**`).join('\n'))
          .setFooter({ text: `Abigail 💕 — ${highlights.length}/${MAX_HIGHLIGHTS}` })
          .setTimestamp();

        return interaction.reply({ embeds: [embed] });
      }

      case 'clear': {
        // Clear only works for self (not other users)
        const selfHighlights = getUserHighlights(interaction.client, interaction.user.id, guildId);
        if (selfHighlights.length === 0) {
          return interaction.reply({ content: 'You have no highlights to clear!', flags: MessageFlags.Ephemeral });
        }

        const count = selfHighlights.length;
        selfHighlights.length = 0;

        return interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor(0xED4245)
            .setTitle('🗑️ All Highlights Cleared')
            .setDescription(`Removed **${count}** highlight(s).`)
            .setFooter({ text: 'Abigail 💕 — Highlights' })
            .setTimestamp()],
        });
      }
    }
  },
};
