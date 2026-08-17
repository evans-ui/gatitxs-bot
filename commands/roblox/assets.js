const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

const { obtenerUserId } = require('../../utils/roblox');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('assets')
    .setDescription(
      'Muestra los assets públicos creados por un usuario de Roblox'
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

      const assetsRes = await axios.get(
        'https://catalog.roblox.com/v1/search/items',
        {
          params: {
            CreatorTargetId: userId,
            CreatorType: 'User',
            Limit: 10,
            SortType: 3
          }
        }
      );

      const assets = assetsRes.data.data;

      if (!assets.length) {
        return interaction.editReply(
          `ℹ️ El usuario **${username}** no tiene assets públicos.`
        );
      }

      const embed = {
        title: `Assets públicos de ${username}`,
        color: 0x00b0f4,

        fields: assets
          .filter(asset => asset.name && asset.id)
          .map(asset => ({
            name: asset.name || 'Sin nombre',

            value:
              `[Ver en Roblox](https://www.roblox.com/catalog/${asset.id})`,

            inline: true
          })),

        footer: {
          text: `Mostrando ${assets.length} assets`
        }
      };

      return interaction.editReply({
        embeds: [embed]
      });

    } catch (err) {
      console.error(
        'Error al obtener assets:',
        err.message
      );

      return interaction.editReply(
        '⚠️ Ocurrió un error al obtener los assets del usuario.'
      );
    }
  }
};