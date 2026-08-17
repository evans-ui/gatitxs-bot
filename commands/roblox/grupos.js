const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

const { obtenerUserId } = require('../../utils/roblox');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('grupos')
    .setDescription(
      'Muestra los grupos de Roblox en los que está un usuario'
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

      const groupRes = await axios.get(
        `https://groups.roblox.com/v2/users/${userId}/groups/roles`
      );

      const groups = groupRes.data.data;

      if (!groups.length) {
        return interaction.editReply(
          `ℹ️ El usuario **${username}** no pertenece a ningún grupo.`
        );
      }

      const embed = {
        title: `Grupos de ${username}`,

        description:
          groups
            .slice(0, 20)
            .map(group =>
              `[${group.group.name}](https://www.roblox.com/groups/${group.group.id}) - ${group.role.name}`
            )
            .join('\n'),

        color: 0x1abc9c,

        footer: {
          text:
            `Mostrando ${Math.min(20, groups.length)} de ${groups.length} grupos`
        }
      };

      return interaction.editReply({
        embeds: [embed]
      });

    } catch (err) {
      console.error(
        'Error al obtener grupos:',
        err.message
      );

      return interaction.editReply(
        '⚠️ Ocurrió un error al consultar los grupos del usuario.'
      );
    }
  }
};