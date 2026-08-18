const { SlashCommandBuilder, MessageFlags, EmbedBuilder, AttachmentBuilder } = require('discord.js');

const RANDOM_LINES = [
  "Hey everyone! 👋",
  "I'm here! ✨",
  "What's up? 😄",
  "Hello beautiful people! 💕",
  "Did someone call me? 🤔",
  "I just wanted to say hi! 🌸",
  "Guess who's back? 😎",
  "Sending hugs to everyone! 🤗",
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mimic')
    .setDescription('🎭 Mimic another user in this channel')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to mimic')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('message')
        .setDescription('What should they say? (random if blank)')
        .setRequired(false)
        .setMaxLength(2000))
    .addAttachmentOption(option =>
      option.setName('attachment')
        .setDescription('Image, GIF, or file to send as attachment')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('reply_to')
        .setDescription('Message ID to reply to')
        .setRequired(false)),

  async execute(interaction) {
    // Defer immediately to avoid 3-second interaction timeout
    await interaction.deferReply({ flags: MessageFlags.Ephemeral }).catch(() => {});

    const supabase = require('../db');
    const targetUser = interaction.options.getUser('user');
    const customMsg = interaction.options.getString('message');
    const attachment = interaction.options.getAttachment('attachment');
    const replyToId = interaction.options.getString('reply_to');

    /* ── Check mimic access ── */
    const BOT_OWNER_ID = process.env.BOT_OWNER_ID || '868871716208791593';
    const isBotOwner = interaction.user.id === BOT_OWNER_ID;
    const isServerOwner = interaction.guild.ownerId === interaction.user.id;
    let hasAccess = isBotOwner || isServerOwner;

    // Check Supabase access list (with error handling if table doesn't exist)
    if (!hasAccess && supabase) {
      try {
        const { data } = await supabase
          .from('mimic_access')
          .select('user_id')
          .eq('guild_id', interaction.guild.id)
          .eq('user_id', interaction.user.id)
          .maybeSingle();
        hasAccess = !!data;
      } catch (err) {
        console.error('Mimic access DB check failed:', err.message);
      }
    }

    // Fallback: check in-memory access list on client
    if (!hasAccess && interaction.client.mimicAccess) {
      const guildAccess = interaction.client.mimicAccess.get(interaction.guild.id);
      hasAccess = guildAccess && guildAccess.has(interaction.user.id);
    }

    if (!hasAccess) {
      return interaction.editReply({
        content: '🚫 You don\'t have mimic access! Only the server owner can grant it with `/mimic-access`.',
      });
    }

    /* ── Check mimic-protected ── */
    if (targetUser.id !== interaction.user.id) {
      let isProtected = false;
      if (!isBotOwner) {
        if (supabase) {
          try {
            const { data } = await supabase
              .from('mimic_protected')
              .select('user_id')
              .eq('guild_id', interaction.guild.id)
              .eq('user_id', targetUser.id)
              .maybeSingle();
            isProtected = !!data;
          } catch (err) {
            console.error('Mimic protected DB check failed:', err.message);
          }
        }
        if (!isProtected && interaction.client.mimicProtected) {
          const guildProtected = interaction.client.mimicProtected.get(interaction.guild.id);
          isProtected = guildProtected && guildProtected.has(targetUser.id);
        }
        if (isProtected) {
          return interaction.editReply({ content: `🛡️ **${targetUser.username}** is mimic-protected! Only the bot owner can remove protection.` });
        }
      }
    }

    // Check Manage Webhooks permission before trying
    const botMember = await interaction.guild.members.fetchMe();
    if (!botMember.permissionsIn(interaction.channel).has('ManageWebhooks')) {
      return interaction.editReply({
        content: '🚫 I need **Manage Webhooks** permission in this channel to mimic!\n\n**Fix:** Server Settings → Roles → Bot role → ✅ Manage Webhooks ON',
      });
    }

    const targetMember = interaction.options.getMember('user');
    const targetName = targetMember?.displayName || targetUser.username;
    const targetAvatar = targetUser.displayAvatarURL({ dynamic: true, size: 256 });

    const msgContent = customMsg || RANDOM_LINES[Math.floor(Math.random() * RANDOM_LINES.length)];

    /* ── Webhook magic ── */
    try {
      const webhook = await interaction.channel.createWebhook({
        name: targetName,
        avatar: targetAvatar,
        reason: `Mimic command by ${interaction.user.tag}`,
      });

      // Build webhook send options
      const sendOptions = {
        username: targetName,
        avatarURL: targetAvatar,
        allowedMentions: { repliedUser: true },
      };

      // Content
      if (msgContent) sendOptions.content = msgContent;

      // Reply to message — simple messageId reference
      if (replyToId) {
        sendOptions.messageReference = replyToId;
      }

      // Attachment — try fetch & send as file, fallback to URL in message
      if (attachment) {
        let fileSent = false;
        // Try attachment.url first, then proxyURL
        const urls = [attachment.url, attachment.proxyURL].filter((v, i, a) => a.indexOf(v) === i);
        for (const imgURL of urls) {
          try {
            const res = await fetch(imgURL, {
              headers: { 'User-Agent': 'Mozilla/5.0' },
              redirect: 'follow',
            });
            if (res.ok) {
              const buffer = Buffer.from(await res.arrayBuffer());
              if (buffer.length > 0) {
                sendOptions.files = [new AttachmentBuilder(buffer, { name: attachment.name })];
                fileSent = true;
                console.log(`✅ Mimic attachment fetched (${buffer.length} bytes) from ${imgURL.split('/').pop()}`);
                break;
              }
            }
          } catch (e) {
            console.error(`Mimic fetch failed (${imgURL.substring(0, 60)}...):`, e.message);
          }
        }
        // If all fetches fail, put URL in message so Discord auto-previews it
        if (!fileSent) {
          const imgURL = attachment.url;
          sendOptions.content = (sendOptions.content ? sendOptions.content + '\n' : '') + imgURL;
          console.log('⚠️ Mimic attachment fetch failed, sending URL as fallback');
        }
      }

      await webhook.send(sendOptions);
      await webhook.delete('Mimic command cleanup');

      /* ── Resolve reply message for log ── */
      let replyMsgInfo = null;
      if (replyToId) {
        try {
          const fetched = await interaction.channel.messages.fetch(replyToId).catch(() => null);
          if (fetched) {
            replyMsgInfo = `${fetched.author.tag}: "${(fetched.content || '').substring(0, 80)}"`;
          }
        } catch (_) { /* ignore */ }
        if (!replyMsgInfo) replyMsgInfo = `Unknown message (ID: ${replyToId})`;
      }

      /* ── Log the mimic use on client (persistent) ── */
      if (!interaction.client.mimicLog) interaction.client.mimicLog = new Map();

      const logKey = `${interaction.guild.id}-${interaction.user.id}`;
      const logEntry = {
        target: targetUser,
        targetName,
        message: msgContent,
        attachment: attachment ? attachment.name : null,
        replyTo: replyMsgInfo,
        channel: interaction.channel,
        timestamp: new Date(),
      };

      const userLog = interaction.client.mimicLog.get(logKey) || [];
      userLog.unshift(logEntry);
      if (userLog.length > 100) userLog.pop();
      interaction.client.mimicLog.set(logKey, userLog);

      /* ── Send log to mimic-log channel if set ── */
      let logChannelId = null;

      if (interaction.client.mimicLogChannel) {
        logChannelId = interaction.client.mimicLogChannel.get(interaction.guild.id);
      }

      if (!logChannelId && supabase) {
        try {
          const { data, error: dbErr } = await supabase
            .from('mimic_log_channel')
            .select('channel_id')
            .eq('guild_id', interaction.guild.id)
            .maybeSingle();
          if (!dbErr && data) {
            logChannelId = data.channel_id;
            if (!interaction.client.mimicLogChannel) interaction.client.mimicLogChannel = new Map();
            interaction.client.mimicLogChannel.set(interaction.guild.id, logChannelId);
          }
        } catch (err) { /* ignore */ }
      }

      if (!logChannelId) {
        const existingCh = interaction.guild.channels.cache.find(ch => ch.name === 'mimic-logs' && ch.isTextBased());
        if (existingCh) {
          logChannelId = existingCh.id;
          if (!interaction.client.mimicLogChannel) interaction.client.mimicLogChannel = new Map();
          interaction.client.mimicLogChannel.set(interaction.guild.id, logChannelId);
          if (supabase) {
            try {
              await supabase.from('mimic_log_channel').upsert({ guild_id: interaction.guild.id, channel_id: existingCh.id, channel_name: existingCh.name }, { onConflict: 'guild_id' });
            } catch (e) { /* ignore */ }
          }
        }
      }

      if (logChannelId) {
        try {
          const logCh = await interaction.client.channels.fetch(logChannelId).catch(() => null);
          if (logCh && logCh.isSendable()) {
            const logParts = [
              `┣ 🎭 **Mimicked:** ${targetName} (<@${targetUser.id}>)`,
              `┣ 👤 **By:** ${interaction.user.username} (<@${interaction.user.id}>)`,
              `┣ 📢 **Channel:** <#${interaction.channel.id}>`,
              `┣ 💬 **Message:**\n> ${msgContent.length > 300 ? msgContent.slice(0, 300) + '...' : msgContent}`,
            ];
            if (attachment) logParts.push(`┣ 📎 **Attachment:** ${attachment.name}`);
            if (replyMsgInfo) logParts.push(`┣ ↩️ **Replying to:** ${replyMsgInfo}`);
            logParts.push(`┗ ⏰ **Time:** <t:${Math.floor(Date.now() / 1000)}:R>`);

            const logEmbed = new EmbedBuilder()
              .setColor(0x2B2D31)
              .setAuthor({ name: `🎭 ${interaction.user.username} used /mimic`, iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 128 }) })
              .setDescription('━━━━━━━━━━━━━━━━━━━\n' + logParts.join('\n'))
              .setFooter({ text: `User ID: ${interaction.user.id} | Target ID: ${targetUser.id}` })
              .setTimestamp();
            await logCh.send({ embeds: [logEmbed] });
          }
        } catch (err) { /* ignore log errors */ }
      }

      // Build success reply
      let successMsg = `🎭 Successfully mimicked **${targetName}**!`;
      const extras = [];
      if (attachment) extras.push('📎 Attachment');
      if (replyToId) extras.push('↩️ Reply');
      if (extras.length) successMsg += ` (${extras.join(', ')})`;

      await interaction.editReply({
        content: successMsg,
      });
    } catch (error) {
      console.error('Mimic webhook error:', error.message);
      try {
        await interaction.editReply({
          content: `💔 Couldn't mimic — **${error.message}**\n\n💡 Make sure I have **Manage Webhooks** permission!`,
        });
      } catch (e) { /* interaction already expired */ }
    }
  },
};
