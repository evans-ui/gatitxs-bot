const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

const { obtenerUserId } = require('../../utils/roblox');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('current')
    .setDescription(
      'Muestra qué juego está jugando actualmente un usuario de Roblox (si está en línea)'
    )
    .addStringOption(option =>
      option
        .setName('usuario')
        .setDescription('Nombre de usuario de Roblox')
        .setRequired(true)
    ),

  async execute(interaction) {
    const username =
      interaction.options.getString('usuario');

    await interaction.deferReply();

    try {
      const userId =
        await obtenerUserId(username);

      if (!userId) {
        return interaction.editReply(
          `❌ No se encontró el usuario **${username}**.`
        );
      }

      const presenceRes = await axios.post(
        'https://presence.roblox.com/v1/presence/users',
        {
          userIds: [userId]
        }
      );

      const presence =
        presenceRes.data.userPresences[0];

      if (presence.userPresenceType === 2) {

        if (
          presence.placeId &&
          presence.universeId
        ) {
          const gameDetailsRes =
            await axios.get(
              `https://games.roblox.com/v1/games?universeIds=${presence.universeId}`
            );

          const gameData =
            gameDetailsRes.data.data[0];

          const embed = {
            title:
              `${username} está jugando ahora`,

            description:
              `🎮 **${gameData.name || 'Juego desconocido'}**`,

            color: 0x00b0f4,

            fields: [
              {
                name: '🔗 Enlace al juego',

                value:
                  `[Unirse al juego](https://www.roblox.com/games/${presence.placeId})`
              }
            ],

            footer: {
              text: `User ID: ${userId}`
            }
          };

          return interaction.editReply({
            embeds: [embed]
          });
        }

        return interaction.editReply(
          `🎮 **${username}** está en un juego, pero no es posible ver cuál.\n` +
          `Esto puede deberse a que:\n` +
          `• El juego es privado\n` +
          `• El usuario está en Roblox Studio\n` +
          `• Tiene su actividad oculta.`
        );
      }

      if (presence.userPresenceType === 1) {
        return interaction.editReply(
          `🟢 **${username}** está en línea, pero no está en ningún juego actualmente.`
        );
      }

      return interaction.editReply(
        `🔴 **${username}** no está en línea en este momento.`
      );

    } catch (error) {
      console.error(
        'Error en /current:',
        error.message
      );

      return interaction.editReply(
        '⚠️ Hubo un error al obtener el estado del usuario.'
      );
    }
  }
};