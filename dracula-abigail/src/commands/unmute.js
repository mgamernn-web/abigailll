const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('🔊 Unmute a user')
    .addUserOption(opt =>
      opt.setName('user').setDescription('User to unmute').setRequired(true),
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
      return interaction.reply({ content: '❌ Could not find that user.', flags: MessageFlags.Ephemeral });
    }

    try {
      await targetMember.timeout(null, `Unmuted by ${interaction.user.tag}`);
      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('🔊 Unmuted')
        .setDescription(`**${target.tag}** has been unmuted.`)
        .addFields({ name: '👮 By', value: interaction.user.tag, inline: true })
        .setFooter({ text: 'Abigail 💕' })
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    } catch (e) {
      return interaction.reply({ content: '❌ Failed to unmute!', flags: MessageFlags.Ephemeral });
    }
  },
};
