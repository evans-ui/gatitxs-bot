const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

const { obtenerUserId } = require('../../utils/roblox');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar2d')
    .setDescription(
      'Muestra el avatar 2D de un usuario de Roblox'
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

      const thumbRes = await axios.get(
        'https://thumbnails.roblox.com/v1/users/avatar-headshot',
        {
          params: {
            userIds: userId,
            size: '720x720',
            format: 'Png',
            isCircular: false
          }
        }
      );

      const avatar = thumbRes.data.data[0];

      if (
        !avatar ||
        avatar.state !== 'Completed' ||
        !avatar.imageUrl
      ) {
        return interaction.editReply(
          '⚠️ Roblox no devolvió la imagen del avatar.'
        );
      }

      const embed = {
        title: `Avatar 2D de ${username}`,

        image: {
          url: avatar.imageUrl
        },

        color: 0x00b0f4,

        footer: {
          text: `User ID: ${userId}`
        }
      };

      return interaction.editReply({
        embeds: [embed]
      });

    } catch (error) {
      console.error(
        'Error al obtener avatar 2D:',
        error
      );

      return interaction.editReply(
        '⚠️ Ocurrió un error al obtener el avatar.'
      );
    }
  }
};