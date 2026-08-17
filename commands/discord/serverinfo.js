const {
  SlashCommandBuilder,
  EmbedBuilder,
  ChannelType,
  PermissionFlagsBits
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Muestra información detallada del servidor'),

  async execute(interaction) {
    const guild = interaction.guild;

    // El comando solamente puede utilizarse dentro de un servidor.
    if (!guild) {
      return interaction.reply({
        content: 'Este comando solo puede utilizarse dentro de un servidor.',
        ephemeral: true
      });
    }

    /*
     * ============================================================
     * INFORMACIÓN BÁSICA
     * ============================================================
     */

    const serverName = guild.name;
    const serverId = guild.id;

    const description =
      guild.description || 'Este servidor no tiene una descripción.';

    const creationTimestamp = Math.floor(
      guild.createdTimestamp / 1000
    );

    const creationDate = `<t:${creationTimestamp}:F>`;

    /*
     * ============================================================
     * ICONO Y BANNER
     * ============================================================
     */

    const iconURL = guild.iconURL({
      extension: 'png',
      size: 512
    });

    const bannerURL = guild.bannerURL({
      extension: 'png',
      size: 2048
    });

    /*
     * ============================================================
     * PROPIETARIO
     * ============================================================
     */

    let ownerText = 'No disponible';

    try {
      const owner = await guild.fetchOwner();

      ownerText =
        `${owner.user.tag}\n` +
        `\`${owner.id}\``;
    } catch (error) {
      console.error(
        `No se pudo obtener el propietario de ${guild.name}:`,
        error
      );
    }

    /*
     * ============================================================
     * URL PERSONALIZADA
     * ============================================================
     */

    let vanityURL = 'No disponible';

    try {
      const vanity = await guild.fetchVanityData();

      if (vanity?.code) {
        vanityURL = `https://discord.gg/${vanity.code}`;
      }
    } catch (error) {
      // No todos los servidores tienen URL personalizada.
      vanityURL = 'No disponible';
    }

    /*
     * ============================================================
     * MIEMBROS
     * ============================================================
     *
     * No hacemos guild.members.fetch().
     *
     * Esto es importante porque en servidores grandes descargar
     * todos los miembros solamente para contar bots puede ser
     * innecesariamente costoso.
     */

    const totalMembers = guild.memberCount;

    /*
     * Contamos únicamente los bots que ya están disponibles
     * en la caché.
     *
     * Si el servidor tiene miembros que todavía no están en caché,
     * el número de bots puede ser inferior al real.
     */

    const cachedBots = guild.members.cache.filter(
      member => member.user.bot
    ).size;

    /*
     * ============================================================
     * ROLES
     * ============================================================
     *
     * guild.roles.cache ya contiene la información de los roles.
     *
     * El @everyone también aparece en la colección, por eso
     * lo excluimos.
     */

    const roleCount = guild.roles.cache.filter(
      role => role.id !== guild.id
    ).size;

    /*
     * ============================================================
     * BANEADOS
     * ============================================================
     *
     * Solamente intentamos obtener los baneados si el bot tiene
     * permiso para hacerlo.
     */

    let bannedCount = 'No disponible';

    const canViewBans = guild.members.me?.permissions.has(
      PermissionFlagsBits.BanMembers
    );

    if (canViewBans) {
      try {
        const bans = await guild.bans.fetch();

        bannedCount = bans.size;
      } catch (error) {
        console.error(
          `No se pudieron obtener los baneados de ${guild.name}:`,
          error
        );

        bannedCount = 'No disponible';
      }
    }

    /*
     * ============================================================
     * MEJORAS DEL SERVIDOR
     * ============================================================
     */

    const boostCount =
      guild.premiumSubscriptionCount || 0;

    const boostTierNames = {
      none: 'Nivel 0',
      tier_1: 'Nivel 1',
      tier_2: 'Nivel 2',
      tier_3: 'Nivel 3'
    };

    const boostTier =
      boostTierNames[guild.premiumTier] || 'Nivel 0';

    /*
     * ============================================================
     * CANALES
     * ============================================================
     */

    const channels = guild.channels.cache;

    const totalChannels = channels.size;

    const textChannels = channels.filter(
      channel => channel.type === ChannelType.GuildText
    ).size;

    const voiceChannels = channels.filter(
      channel => channel.type === ChannelType.GuildVoice
    ).size;

    const categoryChannels = channels.filter(
      channel => channel.type === ChannelType.GuildCategory
    ).size;

    const announcementChannels = channels.filter(
      channel => channel.type === ChannelType.GuildAnnouncement
    ).size;

    const forumChannels = channels.filter(
      channel => channel.type === ChannelType.GuildForum
    ).size;

    const stageChannels = channels.filter(
      channel => channel.type === ChannelType.GuildStageVoice
    ).size;

    /*
     * ============================================================
     * REGIÓN
     * ============================================================
     *
     * Discord ya no expone las antiguas regiones de servidor
     * como us-east, eu-west, etc.
     */

    const region = 'Automática';

    /*
     * ============================================================
     * EMBED
     * ============================================================
     */

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(serverName)
      .setDescription(description);

    /*
     * ============================================================
     * THUMBNAIL
     * ============================================================
     *
     * Solamente ponemos thumbnail si el servidor tiene icono.
     */

    if (iconURL) {
      embed.setThumbnail(iconURL);
    }

    /*
     * ============================================================
     * INFORMACIÓN GENERAL
     * ============================================================
     */

    embed.addFields(
      {
        name: 'Información general',
        value:
          `**Nombre**\n${serverName}\n\n` +
          `**ID**\n\`${serverId}\`\n\n` +
          `**Creación**\n${creationDate}\n\n` +
          `**Región**\n${region}`,
        inline: true
      },

      {
        name: 'Propietario',
        value:
          `${ownerText}\n\n` +
          `**URL personalizada**\n${vanityURL}`,
        inline: true
      }
    );

    /*
     * ============================================================
     * ESTADÍSTICAS
     * ============================================================
     */

    embed.addFields({
      name: 'Estadísticas',
      value:
        `**Miembros**\n${totalMembers.toLocaleString('es-ES')}\n\n` +
        `**Bots en caché**\n${cachedBots.toLocaleString('es-ES')}\n\n` +
        `**Roles**\n${roleCount.toLocaleString('es-ES')}\n\n` +
        `**Baneados**\n${
          typeof bannedCount === 'number'
            ? bannedCount.toLocaleString('es-ES')
            : bannedCount
        }`,
      inline: true
    });

    /*
     * ============================================================
     * MEJORAS
     * ============================================================
     */

    embed.addFields({
      name: 'Mejoras',
      value:
        `**Nivel**\n${boostTier}\n\n` +
        `**Mejoras activas**\n${boostCount.toLocaleString('es-ES')}`,
      inline: true
    });

    /*
     * ============================================================
     * CANALES
     * ============================================================
     */

    embed.addFields({
      name: 'Canales',
      value:
        `**Total:** ${totalChannels}\n` +
        `**Texto:** ${textChannels}\n` +
        `**Voz:** ${voiceChannels}\n` +
        `**Categorías:** ${categoryChannels}\n` +
        `**Anuncios:** ${announcementChannels}\n` +
        `**Foros:** ${forumChannels}\n` +
        `**Escenario:** ${stageChannels}`,
      inline: false
    });

    /*
     * ============================================================
     * BANNER
     * ============================================================
     *
     * Si el servidor tiene banner, lo mostramos como imagen
     * grande al final del embed.
     */

    if (bannerURL) {
      embed.setImage(bannerURL);
    }

    /*
     * ============================================================
     * FOOTER
     * ============================================================
     */

    embed.setFooter({
      text: `ID: ${serverId}`
    });

    embed.setTimestamp();

    /*
     * ============================================================
     * RESPUESTA
     * ============================================================
     */

    await interaction.reply({
      embeds: [embed]
    });
  }
};