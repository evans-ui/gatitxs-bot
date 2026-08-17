const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

const { buscarUsuario } = require('../../utils/roblox');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('perfil')
    .setDescription(
      'Muestra la información del perfil de un usuario de Roblox'
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
      const user = await buscarUsuario(username);

      if (!user) {
        return interaction.editReply(
          '❌ No se encontró el usuario.'
        );
      }

      const userId = user.id;

      const [profile, thumbnail] = await Promise.all([
        axios.get(
          `https://users.roblox.com/v1/users/${userId}`
        ),

        axios.get(
          `https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=420x420&format=Png&isCircular=false`
        )
      ]);

      const info = profile.data;

      const avatarUrl =
        thumbnail.data.data[0]?.imageUrl;

      const embed = {
        title: info.displayName || info.name,

        url:
          `https://www.roblox.com/users/${userId}/profile`,

        color: 0x0099ff,

        thumbnail: {
          url: avatarUrl
        },

        fields: [
          {
            name: 'Username',
            value: info.name,
            inline: true
          },
          {
            name: 'User ID',
            value: userId.toString(),
            inline: true
          },
          {
            name: 'Fecha de creación',
            value:
              new Date(info.created)
                .toLocaleDateString(),
            inline: false
          }
        ]
      };

      if (info.description) {
        embed.fields.push({
          name: 'Descripción',
          value: info.description
        });
      }

      return interaction.editReply({
        embeds: [embed]
      });

    } catch (error) {
      console.error(
        'Error al obtener perfil:',
        error.message
      );

      return interaction.editReply(
        '⚠️ Hubo un error al consultar el perfil.'
      );
    }
  }
};