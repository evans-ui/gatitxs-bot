const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

const { obtenerUserId } = require('../../utils/roblox');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('amigos')
    .setDescription(
      'Muestra los amigos públicos de un usuario de Roblox'
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

      const friendsRes = await axios.get(
        `https://friends.roblox.com/v1/users/${userId}/friends`
      );

      const friends = friendsRes.data.data;

      if (!friends.length) {
        return interaction.editReply(
          `ℹ️ El usuario **${username}** no tiene amigos públicos.`
        );
      }

      const perPage = 10;
      let currentPage = 0;

      const generateEmbed = page => {
        const start = page * perPage;
        const end = start + perPage;

        const pageFriends =
          friends.slice(start, end);

        return {
          title: `👥 Amigos públicos de ${username}`,

          description:
            pageFriends
              .map(friend =>
                `[${friend.displayName || friend.name}](https://www.roblox.com/users/${friend.id}/profile)`
              )
              .join('\n'),

          color: 0x00b0f4,

          footer: {
            text:
              `Página ${page + 1} de ${Math.ceil(
                friends.length / perPage
              )}`
          }
        };
      };

      const row = {
        type: 1,

        components: [
          {
            type: 2,
            label: '⬅️ Anterior',
            style: 1,
            custom_id: 'prev',
            disabled: true
          },
          {
            type: 2,
            label: '➡️ Siguiente',
            style: 1,
            custom_id: 'next',
            disabled: friends.length <= perPage
          }
        ]
      };

      const reply = await interaction.editReply({
        embeds: [generateEmbed(currentPage)],
        components: [row]
      });

      const collector =
        reply.createMessageComponentCollector({
          time: 60000,
          filter: i =>
            i.user.id === interaction.user.id
        });

      collector.on('collect', async i => {
        if (i.customId === 'next') {
          currentPage++;
        } else if (i.customId === 'prev') {
          currentPage--;
        }

        row.components[0].disabled =
          currentPage === 0;

        row.components[1].disabled =
          currentPage >=
          Math.ceil(friends.length / perPage) - 1;

        await i.update({
          embeds: [generateEmbed(currentPage)],
          components: [row]
        });
      });

      collector.on('end', async () => {
        row.components.forEach(
          button => button.disabled = true
        );

        try {
          await interaction.editReply({
            components: [row]
          });
        } catch {}
      });

    } catch (err) {
      console.error(
        'Error en /amigos:',
        err.message
      );

      return interaction.editReply(
        '⚠️ Hubo un error al obtener los amigos.'
      );
    }
  }
};