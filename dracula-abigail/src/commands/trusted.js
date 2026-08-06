const {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('trusted')
    .setDescription('👑 Manage trusted users (bot owner only)')
    .addSubcommand(sub =>
      sub.setName('add').setDescription('Add a user as trusted')
        .addUserOption(opt => opt.setName('user').setDescription('User to trust').setRequired(true)),
    )
    .addSubcommand(sub =>
      sub.setName('remove').setDescription('Remove a trusted user')
        .addUserOption(opt => opt.setName('user').setDescription('User to untrust').setRequired(true)),
    )
    .addSubcommand(sub =>
      sub.setName('list').setDescription('List all trusted users'),
    )
    .addSubcommand(sub =>
      sub.setName('clear').setDescription('Remove all trusted users'),
    ),

  async execute(interaction) {
    const BOT_OWNER_ID = process.env.BOT_OWNER_ID || '868871716208791593';

    if (interaction.user.id !== BOT_OWNER_ID) {
      return interaction.reply({ content: '🚫 Only the bot owner can manage trusted users!', flags: MessageFlags.Ephemeral });
    }

    const sub = interaction.options.getSubcommand();
    const { client, guild } = interaction;

    if (!client.trustedUsers) client.trustedUsers = new Map();
    if (!client.trustedUsers.has(guild.id)) client.trustedUsers.set(guild.id, new Set());
    const trusted = client.trustedUsers.get(guild.id);

    switch (sub) {
      case 'add': {
        const user = interaction.options.getUser('user');
        if (user.id === BOT_OWNER_ID) {
          return interaction.reply({ content: '❌ The bot owner is already trusted!', flags: MessageFlags.Ephemeral });
        }
        if (trusted.has(user.id)) {
          return interaction.reply({ content: `✅ **${user.username}** is already trusted!`, flags: MessageFlags.Ephemeral });
        }
        trusted.add(user.id);
        return interaction.reply({ embeds: [new EmbedBuilder()
          .setColor(0x57F287)
          .setTitle('✅ Trusted User Added')
          .setDescription(`**${user.username}** (<@${user.id}>) now has access to all bot commands!`)
          .addFields(
            { name: '👤 User', value: `${user.username} (${user.id})`, inline: true },
            { name: '🏠 Server', value: guild.name, inline: true },
          )
          .setFooter({ text: 'Abigail 💕 — Trusted Users' })
          .setTimestamp()] });
      }

      case 'remove': {
        const user = interaction.options.getUser('user');
        trusted.delete(user.id);
        return interaction.reply({ embeds: [new EmbedBuilder()
          .setColor(0xED4245)
          .setTitle('🗑️ Trusted User Removed')
          .setDescription(`**${user.username}** no longer has access to bot commands.`)
          .setFooter({ text: 'Abigail 💕 — Trusted Users' })
          .setTimestamp()] });
      }

      case 'list': {
        if (trusted.size === 0) {
          return interaction.reply({ embeds: [new EmbedBuilder()
            .setColor(0x2C2F33)
            .setTitle('👑 Trusted Users')
            .setDescription('No trusted users set. Use `/trusted add` to add one!')
            .setFooter({ text: 'Abigail 💕 — Trusted Users' })
            .setTimestamp()] });
        }
        const list = [...trusted].map((id, i) => `\`${i + 1}.\` <@${id}> (\`${id}\`)`).join('\n');
        return interaction.reply({ embeds: [new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle('👑 Trusted Users')
          .setDescription(list)
          .setFooter({ text: `Abigail 💕 — ${trusted.size} trusted user(s)` })
          .setTimestamp()] });
      }

      case 'clear': {
        const count = trusted.size;
        trusted.clear();
        return interaction.reply({ embeds: [new EmbedBuilder()
          .setColor(0xED4245)
          .setTitle('🗑️ All Trusted Users Cleared')
          .setDescription(`Removed **${count}** trusted user(s).`)
          .setFooter({ text: 'Abigail 💕 — Trusted Users' })
          .setTimestamp()] });
      }
    }
  },
};
