const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Muestra información de un usuario')
    .addUserOption(option =>
      option
        .setName('usuario')
        .setDescription('Usuario del que quieres ver la info')
        .setRequired(false)
    ),

  async execute(interaction) {
    const user =
      interaction.options.getUser('usuario') ||
      interaction.user;

    const member =
      interaction.guild.members.cache.get(user.id) ||
      await interaction.guild.members.fetch(user.id)
        .catch(() => null);

    const avatar = user.displayAvatarURL({
      dynamic: true,
      size: 1024
    });

    const userFlags = user.flags?.toArray() || [];

    const badgeEmojis = {
      ActiveDeveloper: '💻',
      BugHunterLevel1: '🐛',
      BugHunterLevel2: '🐞',
      CertifiedModerator: '🛡️',
      HypeSquadOnlineHouse1: '🏠',
      HypeSquadOnlineHouse2: '🏡',
      HypeSquadOnlineHouse3: '🏘️',
      HypeSquadEvents: '🎉',
      Partner: '🤝',
      PremiumEarlySupporter: '✨',
      Staff: '👑',
      VerifiedDeveloper: '🧪',
      System: '⚙️'
    };

    const badges =
      userFlags
        .map(flag => badgeEmojis[flag] || flag)
        .join(' ') || 'Ninguna';

    const createdAt =
      `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`;

    const joinedAt = member?.joinedAt
      ? `<t:${Math.floor(member.joinedAt / 1000)}:F>`
      : 'Desconocido';

    const boostSince = member?.premiumSince
      ? `<t:${Math.floor(member.premiumSince / 1000)}:F>`
      : 'No está boosteando';

    const embed = {
      color: 0x00bfff,
      title: `Información de ${user.tag}`,
      thumbnail: {
        url: avatar
      },

      fields: [
        {
          name: '🆔 ID',
          value: `\`${user.id}\``,
          inline: false
        },
        {
          name: '📅 Cuenta creada el',
          value: createdAt,
          inline: true
        },
        {
          name: '🚪 Entró al servidor el',
          value: joinedAt,
          inline: true
        },
        {
          name: '🚀 Boostea desde',
          value: boostSince,
          inline: true
        },
        {
          name: '🎖️ Insignias',
          value: badges,
          inline: false
        },
        {
          name: '🎨 Avatar',
          value: `[Abrir avatar](${avatar})`,
          inline: false
        }
      ],

      footer: {
        text: `Solicitado por ${interaction.user.tag}`,
        icon_url: interaction.user.displayAvatarURL({
          dynamic: true
        })
      },

      timestamp: new Date()
    };

    await interaction.reply({
      embeds: [embed]
    });
  }
};