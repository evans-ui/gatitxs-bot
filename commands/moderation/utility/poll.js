const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription(
      'Crea una encuesta con reacciones 👍 y 👎'
    )
    .addStringOption(option =>
      option
        .setName('pregunta')
        .setDescription(
          'Escribe la pregunta de la encuesta'
        )
        .setRequired(true)
    ),

  async execute(interaction) {
    const pregunta =
      interaction.options.getString('pregunta');

    try {
      const embed = {
        title: '📊 Encuesta',

        description: pregunta,

        color: 0xf1c40f,

        footer: {
          text:
            `Encuesta creada por ${interaction.user.tag}`,

          icon_url:
            interaction.user.displayAvatarURL({
              dynamic: true
            })
        },

        timestamp: new Date()
      };

      await interaction.reply({
        embeds: [embed]
      });

      const mensaje =
        await interaction.fetchReply();

      await mensaje.react('👍');
      await mensaje.react('👎');

    } catch (error) {
      console.error(
        'Error en /poll:',
        error
      );

      try {
        await interaction.reply({
          content:
            '❌ Hubo un error al crear la encuesta.',
          ephemeral: true
        });
      } catch {}
    }
  }
};