const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('🔇 Mute a user (with optional duration)')
    .addUserOption(opt =>
      opt.setName('user').setDescription('User to mute').setRequired(true),
    )
    .addStringOption(opt =>
      opt.setName('duration').setDescription('Duration (e.g. 10m, 1h, 1d). Default: 10m'),
    ),

  async execute(interaction) {
    const { client, guild, member: authorMember } = interaction;
    const BOT_OWNER_ID = process.env.BOT_OWNER_ID || '868871716208791593';
    const SNOW_ID = '982661154843291658';
    const trusted = client.trustedUsers?.get(guild.id) || new Set();
    const isTrusted = interaction.user.id === BOT_OWNER_ID || interaction.user.id === SNOW_ID || trusted.has(interaction.user.id);

    if (!authorMember.permissions.has(PermissionFlagsBits.ModerateMembers) && !isTrusted) {
      return interaction.reply({ content: 'You need **Moderate Members** permission.', flags: MessageFlags.Ephemeral });
    }

    const target = interaction.options.getUser('user');
    const targetMember = await guild.members.fetch(target.id).catch(() => null);
    if (!targetMember) {
      return interaction.reply({ content: '❌ Could not find that user in this server.', flags: MessageFlags.Ephemeral });
    }
    if (target.id === interaction.user.id) {
      return interaction.reply({ content: "You can't mute yourself!", flags: MessageFlags.Ephemeral });
    }
    if (target.id === client.user.id) {
      return interaction.reply({ content: 'Nice try! 🙄', flags: MessageFlags.Ephemeral });
    }

    // Parse duration
    const durStr = (interaction.options.getString('duration') || '').toLowerCase();
    let duration = 10 * 60 * 1000; // default 10 min
    let display = '10 minutes';
    if (durStr) {
      const t = durStr;
      if (t.endsWith('s')) { duration = Math.min(parseInt(t) * 1000, 403200000); display = `${parseInt(t)} seconds`; }
      else if (t.endsWith('m')) { duration = Math.min(parseInt(t) * 60 * 1000, 403200000); display = `${parseInt(t)} minutes`; }
      else if (t.endsWith('h')) { duration = Math.min(parseInt(t) * 3600 * 1000, 403200000); display = `${parseInt(t)} hours`; }
      else if (t.endsWith('d')) { duration = Math.min(parseInt(t) * 86400 * 1000, 403200000); display = `${parseInt(t)} days`; }
      else { duration = Math.min(parseInt(t) * 60 * 1000, 403200000); display = `${parseInt(t)} minutes`; }
    }

    try {
      await targetMember.timeout(duration, `Muted by ${interaction.user.tag}`);
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('🔇 Muted')
        .setDescription(`**${target.tag}** has been muted for **${display}**.`)
        .addFields(
          { name: '⏱️ Duration', value: display, inline: true },
          { name: '👮 By', value: interaction.user.tag, inline: true },
        )
        .setFooter({ text: 'Abigail 💕' })
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    } catch (e) {
      return interaction.reply({ content: "❌ Failed to mute! Bot's role must be **above** the target's role in server settings.", flags: MessageFlags.Ephemeral });
    }
  },
};
