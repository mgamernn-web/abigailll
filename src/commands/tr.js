const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js');

// Direct Google Translate API — no library dependency
async function googleTranslate(text, toLang, fromLang) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${fromLang || 'auto'}&tl=${toLang}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  let translated = '';
  if (data[0]) {
    for (const part of data[0]) {
      if (part[0]) translated += part[0];
    }
  }
  const srcLang = data[2] || 'auto';
  return { text: translated, from: srcLang };
}

/* ═══════════════════════════════════════════
   🌐 Translation Command
   Translates any language to any language
   Auto-detects source language
   ═══════════════════════════════════════════ */

const LANG_FLAGS = {
  auto: '🔍', hi: '🇮🇳', en: '🇬🇧', ja: '🇯🇵', ko: '🇰🇷', zh: '🇨🇳', fr: '🇫🇷', de: '🇩🇪', es: '🇪🇸', pt: '🇵🇹',
  it: '🇮🇹', ru: '🇷🇺', ar: '🇸🇦', tr: '🇹🇷', th: '🇹🇭', vi: '🇻🇳', id: '🇮🇩', ms: '🇲🇾', nl: '🇳🇱', pl: '🇵🇱',
  sv: '🇸🇪', da: '🇩🇰', fi: '🇫🇮', no: '🇳🇴', el: '🇬🇷', he: '🇮🇱', cs: '🇨🇿', ro: '🇷🇴', hu: '🇭🇺', uk: '🇺🇦',
  bn: '🇧🇩', ta: '🇮🇳', te: '🇮🇳', mr: '🇮🇳', gu: '🇮🇳', kn: '🇮🇳', ml: '🇮🇳', pa: '🇮🇳', ur: '🇵🇰',
};

const LANG_NAMES = {
  auto: 'Auto-detect', hi: 'Hindi', en: 'English', ja: 'Japanese', ko: 'Korean', zh: 'Chinese',
  fr: 'French', de: 'German', es: 'Spanish', pt: 'Portuguese', it: 'Italian', ru: 'Russian',
  ar: 'Arabic', tr: 'Turkish', th: 'Thai', vi: 'Vietnamese', id: 'Indonesian', ms: 'Malay',
  nl: 'Dutch', pl: 'Polish', sv: 'Swedish', da: 'Danish', fi: 'Finnish', no: 'Norwegian',
  el: 'Greek', he: 'Hebrew', cs: 'Czech', ro: 'Romanian', hu: 'Hungarian', uk: 'Ukrainian',
  bn: 'Bengali', ta: 'Tamil', te: 'Telugu', mr: 'Marathi', gu: 'Gujarati', kn: 'Kannada',
  ml: 'Malayalam', pa: 'Punjabi', ur: 'Urdu',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tr')
    .setDescription('🌐 Translate text to any language')
    .addStringOption(option =>
      option.setName('text')
        .setDescription('The text to translate')
        .setRequired(true)
        .setMaxLength(2000))
    .addStringOption(option =>
      option.setName('to')
        .setDescription('Target language (default: Hindi)')
        .setRequired(false)
        .addChoices(
          { name: '🇮🇳 Hindi', value: 'hi' },
          { name: '🇬🇧 English', value: 'en' },
          { name: '🇯🇵 Japanese', value: 'ja' },
          { name: '🇰🇷 Korean', value: 'ko' },
          { name: '🇨🇳 Chinese', value: 'zh' },
          { name: '🇫🇷 French', value: 'fr' },
          { name: '🇩🇪 German', value: 'de' },
          { name: '🇪🇸 Spanish', value: 'es' },
          { name: '🇵🇹 Portuguese', value: 'pt' },
          { name: '🇮🇹 Italian', value: 'it' },
          { name: '🇷🇺 Russian', value: 'ru' },
          { name: '🇸🇦 Arabic', value: 'ar' },
          { name: '🇹🇷 Turkish', value: 'tr' },
          { name: '🇹🇭 Thai', value: 'th' },
          { name: '🇻🇳 Vietnamese', value: 'vi' },
          { name: '🇮🇩 Indonesian', value: 'id' },
          { name: '🇧🇩 Bengali', value: 'bn' },
          { name: '🇵🇰 Urdu', value: 'ur' },
          { name: '🇮🇳 Tamil', value: 'ta' },
          { name: '🇮🇳 Punjabi', value: 'pa' },
        ))
    .addStringOption(option =>
      option.setName('from')
        .setDescription('Source language (default: auto-detect)')
        .setRequired(false)
        .addChoices(
          { name: '🔍 Auto-detect', value: 'auto' },
          { name: '🇮🇳 Hindi', value: 'hi' },
          { name: '🇬🇧 English', value: 'en' },
          { name: '🇯🇵 Japanese', value: 'ja' },
          { name: '🇰🇷 Korean', value: 'ko' },
          { name: '🇨🇳 Chinese', value: 'zh' },
          { name: '🇫🇷 French', value: 'fr' },
          { name: '🇩🇪 German', value: 'de' },
          { name: '🇪🇸 Spanish', value: 'es' },
          { name: '🇸🇦 Arabic', value: 'ar' },
          { name: '🇹🇷 Turkish', value: 'tr' },
          { name: '🇵🇰 Urdu', value: 'ur' },
        )),

  async execute(interaction) {
    const text = interaction.options.getString('text');
    const toLang = interaction.options.getString('to') || 'hi';
    const fromLang = interaction.options.getString('from') || 'auto';

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const result = await googleTranslate(text, toLang, fromLang === 'auto' ? undefined : fromLang);

      const srcCode = result.from || 'auto';
      const srcFlag = LANG_FLAGS[srcCode] || '🔍';
      const tgtFlag = LANG_FLAGS[toLang] || '🌐';
      const srcName = LANG_NAMES[srcCode] || srcCode.toUpperCase();
      const tgtName = LANG_NAMES[toLang] || toLang.toUpperCase();

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('🌐 Translation')
        .setDescription(
          `━━━━━━━━━━━━━━━━━━━\n` +
          `┣ ${srcFlag} **From:** ${srcName}\n` +
          `┣ ${tgtFlag} **To:** ${tgtName}\n` +
          `┗ 📝 **Original:**\n> ${text.length > 500 ? text.slice(0, 500) + '...' : text}`
        )
        .addFields({
          name: `${tgtFlag} Translation`,
          value: result.text.length > 1024 ? result.text.slice(0, 1020) + '...' : result.text,
        })
        .setFooter({ text: `💕 Abigail Translator • ${srcName} → ${tgtName}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Translation error:', error.message);
      await interaction.editReply({
        content: `❌ Translation failed: ${error.message}\n\n💡 Try shorter text or a different language.`,
      });
    }
  },
};
