const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('El bot repite el mensaje que le indiques')
    .addStringOption(option =>
      option
        .setName('mensaje')
        .setDescription('El mensaje que dirá el bot')
        .setRequired(true)
    ),

  async execute(interaction) {
    const mensaje =
      interaction.options.getString('mensaje');

    try {
      await interaction.deferReply({
        ephemeral: true
      });

      await interaction.deleteReply();

      await interaction.channel.send(mensaje);

    } catch (error) {
      console.error(
        'Error en /say:',
        error.message
      );

      try {
        await interaction.reply({
          content:
            '❌ Hubo un error al enviar el mensaje.',
          ephemeral: true
        });
      } catch {}
    }
  }
};