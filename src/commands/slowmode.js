const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('🐢 Set channel slowmode (owner & trusted users only)')
    .addNumberOption(opt =>
      opt.setName('seconds').setDescription('Slowmode duration in seconds (0 = off, max 21600)').setMinValue(0).setMaxValue(21600),
    ),

  async execute(interaction) {
    const { client, guild, member } = interaction;
    const BOT_OWNER_ID = process.env.BOT_OWNER_ID || '868871716208791593';
    const SNOW_ID = '982661154843291658';
    const trusted = client.trustedUsers?.get(guild.id) || new Set();
    const isTrusted = interaction.user.id === BOT_OWNER_ID || interaction.user.id === SNOW_ID || trusted.has(interaction.user.id);

    if (!isTrusted) {
      return interaction.reply({ content: '🚫 Only the bot owner and trusted users can use this command!', flags: 64 });
    }

    if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ content: '❌ I need **Manage Channels** permission to set slowmode!', flags: 64 });
    }

    const seconds = interaction.options.getNumber('seconds') ?? 0;

    try {
      await interaction.channel.setRateLimitPerUser(seconds);

      let display = '0s';
      if (seconds === 0) display = 'Off';
      else if (seconds >= 3600) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        display = mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
      } else if (seconds >= 60) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        display = secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
      } else {
        display = `${seconds}s`;
      }

      const color = seconds === 0 ? 0x57F287 : 0x5865F2;
      const title = seconds === 0 ? '🐢 Slowmode Removed' : '🐢 Slowmode Set';

      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(seconds === 0 ? 'Channel slowmode has been **disabled**!' : `Channel slowmode set to **${display}**!`)
        .addFields(
          { name: '⏱️ Duration', value: `${seconds} seconds (${display})`, inline: true },
          { name: '👤 Set By', value: interaction.user.tag, inline: true },
          { name: '📢 Channel', value: `<#${interaction.channel.id}>`, inline: true },
        )
        .setFooter({ text: 'Abigail 💕 — Slowmode' })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    } catch (e) {
      return interaction.reply({ content: '❌ Failed to set slowmode. Check my permissions!', flags: 64 });
    }
  },
};
