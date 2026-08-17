module.exports = {
  name: 'avatar',

  async execute(message, args) {
    try {
      const usuario =
        message.mentions.users.first() ||
        message.author;

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

      await message.reply({
        embeds: [embed]
      });

    } catch (error) {
      console.error(
        'Error al mostrar avatar:',
        error
      );

      await message.reply(
        '❌ Hubo un error al obtener el avatar.'
      );
    }
  }
};