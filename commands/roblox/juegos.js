const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

const { obtenerUserId } = require('../../utils/roblox');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('juegos')
    .setDescription(
      'Muestra los juegos públicos creados por un usuario de Roblox'
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
          '❌ No se encontró el usuario.'
        );
      }

      const gamesRes = await axios.get(
        `https://games.roblox.com/v2/users/${userId}/games`,
        {
          params: {
            sortOrder: 'Asc',
            limit: 10
          }
        }
      );

      const games = gamesRes.data.data;

      if (!games.length) {
        return interaction.editReply(
          `ℹ️ El usuario **${username}** no tiene juegos públicos.`
        );
      }

      const embed = {
        title: `🎮 Juegos de ${username}`,
        color: 0x57F287,

        fields: games.map(game => ({
          name: game.name || 'Sin nombre',

          value:
            `[Ir al juego](https://www.roblox.com/games/${game.id})\n` +
            `👥 ${game.playing} jugando ahora`,

          inline: false
        })),

        footer: {
          text: `Mostrando ${games.length} juegos`
        }
      };

      return interaction.editReply({
        embeds: [embed]
      });

    } catch (error) {
      console.error(
        'Error al obtener juegos:',
        error.message
      );

      return interaction.editReply(
        '⚠️ Hubo un error al consultar los juegos del usuario.'
      );
    }
  }
};