const {
  SlashCommandBuilder,
  MessageFlags,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const SAD_QUOTES = [
  { text: 'The saddest thing about betrayal is that it never comes from your enemies.', author: 'Unknown' },
  { text: 'Sometimes you have to let go to see if there was anything worth holding onto.', author: 'Unknown' },
  { text: 'The hardest thing is watching the one you love, love someone else.', author: 'Unknown' },
  { text: 'It hurts when you realize you are not as important to someone as you thought.', author: 'Unknown' },
  { text: 'Some people are just not meant to be in your life, no matter how much you want them.', author: 'Unknown' },
  { text: 'The most painful thing is losing yourself in the process of loving someone too much.', author: 'Unknown' },
  { text: 'Silence speaks so much louder than screaming your lungs out.', author: 'Unknown' },
  { text: 'I am not okay, but I smile anyway because that is what everyone expects.', author: 'Unknown' },
  { text: 'The worst feeling is pretending you do not care when it is all you think about.', author: 'Unknown' },
  { text: 'We ignore the ones who adore us and adore the ones who ignore us.', author: 'Unknown' },
  { text: 'Tears are words that need to be written.', author: 'Paulo Coelho' },
  { text: 'The pain you feel today will be the strength you feel tomorrow.', author: 'Unknown' },
  { text: 'It is sad when someone you know becomes someone you knew.', author: 'Henry Rollins' },
  { text: 'Sometimes the person you want the most is the person you are best without.', author: 'Unknown' },
  { text: 'You said you loved me but you lied.', author: 'Unknown' },
];

const ALL_QUOTES = [
  ...SAD_QUOTES,
  { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { text: 'Be yourself; everyone else is already taken.', author: 'Oscar Wilde' },
  { text: 'You must be the change you wish to see in the world.', author: 'Mahatma Gandhi' },
  { text: 'The mind is everything. What you think you become.', author: 'Buddha' },
  { text: 'Turn your wounds into wisdom.', author: 'Oprah Winfrey' },
  { text: 'In the middle of difficulty lies opportunity.', author: 'Albert Einstein' },
  { text: 'Everything you can imagine is real.', author: 'Pablo Picasso' },
];

function pickQuote() {
  return ALL_QUOTES[Math.floor(Math.random() * ALL_QUOTES.length)];
}

function makeQuoteEmbed(q, label) {
  return new EmbedBuilder()
    .setColor(0x2C2F33)
    .setTitle('🖤 Daily Quote')
    .setDescription(`*"${q.text}"*\n\n— **${q.author}**`)
    .setFooter({ text: `Abigail 💕${label ? ' • ' + label : ''}` })
    .setTimestamp();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-quotes')
    .setDescription('🖤 Set up daily sad/aesthetic quotes with images every 24 hours')
    .addChannelOption(opt =>
      opt.setName('channel')
        .setDescription('Channel to post quotes in (leave empty to create a new one)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('theme')
        .setDescription('Quote theme/vibe')
        .addChoices(
          { name: '🖤 Sad + Motivational', value: 'all' },
          { name: '💔 Sad Only', value: 'sad' },
          { name: '✨ Motivational Only', value: 'motive' },
        )
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({
        content: 'You need **Manage Channels** permission to use this command.',
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply();

    const supabase = require('../db');
    const guildId = interaction.guild.id;
    const theme = interaction.options.getString('theme') || 'all';
    let channel = interaction.options.getChannel('channel');

    // If no channel provided, create a new one
    if (!channel) {
      try {
        channel = await interaction.guild.channels.create({
          name: 'daily-quotes',
          topic: '🖤 Daily sad/aesthetic quotes with image cards ✨',
          type: ChannelType.GuildText,
          permissionOverwrites: [
            { id: guildId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
          ],
          reason: 'Auto-created by /setup-quotes',
        });
      } catch (err) {
        return interaction.editReply({ content: `Failed to create channel: ${err.message}` });
      }
    }

    // Save to Supabase for persistence across restarts
    if (supabase) {
      try {
        await supabase
          .from('daily_quote_channels')
          .upsert({ guild_id: guildId, channel_id: channel.id, theme }, { onConflict: 'guild_id' });
      } catch (err) {
        console.error('Failed to save daily quote channel:', err.message);
        // Try creating table if it doesn't exist
        try {
          await supabase.rpc('exec_sql', {
            query: `
              CREATE TABLE IF NOT EXISTS daily_quote_channels (
                guild_id TEXT PRIMARY KEY,
                channel_id TEXT NOT NULL,
                theme TEXT DEFAULT 'all',
                created_at TIMESTAMPTZ DEFAULT NOW()
              );
            `,
          });
          await supabase
            .from('daily_quote_channels')
            .upsert({ guild_id: guildId, channel_id: channel.id, theme }, { onConflict: 'guild_id' });
        } catch (e2) {
          console.error('Also failed to create table:', e2.message);
        }
      }
    }

    // Store in memory
    const client = interaction.client;
    if (!client.dailyQuoteChannels) client.dailyQuoteChannels = new Map();
    if (!client.dailyQuoteThemes) client.dailyQuoteThemes = new Map();
    client.dailyQuoteChannels.set(guildId, channel.id);
    client.dailyQuoteThemes.set(guildId, theme);

    // Theme display name
    const themeName = theme === 'sad' ? '💔 Sad Only' : theme === 'motive' ? '✨ Motivational Only' : '🖤 Sad + Motivational';

    // Setup confirmation embed
    const embed = new EmbedBuilder()
      .setColor(0x2C2F33)
      .setTitle('🖤 Daily Quotes — Setup Complete!')
      .setDescription(
        `Quotes will be posted every **24 hours** in **#${channel.name}**\n\n` +
        `Uses zenquotes API for fresh quotes + local sad/motivational collection.`
      )
      .addFields(
        { name: '📌 Channel', value: `<#${channel.id}>`, inline: true },
        { name: '⏰ Frequency', value: 'Every 24 hours', inline: true },
        { name: '🎭 Theme', value: themeName, inline: true },
        { name: '📊 Quotes', value: `${ALL_QUOTES.length} total loaded`, inline: true },
      )
      .setFooter({ text: 'Abigail 💕 — Quotes persist across bot restarts' })
      .setTimestamp();

    const stopBtn = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`quotes_stop_${guildId}`)
        .setLabel('⏹ Stop Daily Quotes')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`quotes_now_${guildId}`)
        .setLabel('📨 Post Quote Now')
        .setStyle(ButtonStyle.Success),
    );

    await interaction.editReply({ embeds: [embed], components: [stopBtn] });

    // Post the very first quote immediately
    try {
      const q = pickQuote();
      const qEmbed = makeQuoteEmbed(q, 'First Quote!');
      await channel.send({ embeds: [qEmbed] });
    } catch (err) {
      console.error('Failed to post first quote:', err.message);
    }
  },
};
