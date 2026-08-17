const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Muestra el avatar de un usuario de Discord')
    .addUserOption(option =>
      option
        .setName('usuario')
        .setDescription('El usuario del que quieres ver el avatar')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      const usuario =
        interaction.options.getUser('usuario') ||
        interaction.user;

      const embed = {
        title: `Avatar de ${usuario.username}`,
        image: {
          url: usuario.displayAvatarURL({
            dynamic: true,
            size: 512
          })
        },
        color: 0x00b0f4,
        footer: {
          text: `ID: ${usuario.id}`
        }
      };

      await interaction.reply({
        embeds: [embed]
      });

    } catch (error) {
      console.error('Error al mostrar avatar:', error);

      await interaction.reply(
        '❌ Hubo un error al obtener el avatar.'
      );
    }
  }
};