const fetch = (...args) =>
  import('node-fetch')
    .then(({ default: fetch }) => fetch(...args));

module.exports = {
  name: 'seticono',

  async execute(message, args) {
    try {
      if (
        !message.member.permissions.has(
          'ManageRoles'
        )
      ) {
        return message.reply(
          '❌ No tienes permisos para gestionar roles.'
        );
      }

      const rol =
        message.mentions.roles.first();

      const emojiInput =
        args[1];

      if (!rol) {
        return message.reply(
          '❌ Uso: `g.seticono @rol 🎉` o `g.seticono @rol <:emoji:123456>`'
        );
      }

      if (!emojiInput) {
        return message.reply(
          '❌ Debes especificar un emoji. Ejemplo: `g.seticono @rol 🎉`'
        );
      }

      if (
        !message.guild.members.me
          .permissions.has('ManageRoles')
      ) {
        return message.reply(
          '❌ No tengo permisos para editar roles.'
        );
      }

      const botRole =
        message.guild.members.me.roles.highest;

      if (botRole.position <= rol.position) {
        return message.reply(
          '❌ No puedo modificar este rol porque está por encima de mi rol más alto.'
        );
      }

      const customEmojiRegex =
        /^<a?:\w+:(\d+)>$/;

      const match =
        emojiInput.match(customEmojiRegex);

      if (match) {
        const emojiId =
          match[1];

        const isAnimated =
          emojiInput.startsWith('<a:');

        const extension =
          isAnimated ? 'gif' : 'png';

        const emojiUrl =
          `https://cdn.discordapp.com/emojis/${emojiId}.${extension}`;

        const res =
          await fetch(emojiUrl);

        if (!res.ok) {
          throw new Error(
            'No se pudo descargar el emoji.'
          );
        }

        const iconBuffer =
          await res.buffer();

        await rol.setIcon(iconBuffer);

        await message.reply(
          `✅ Ícono del rol **${rol.name}** actualizado con emoji personalizado.`
        );

      } else {
        await rol.setIcon(emojiInput);

        await message.reply(
          `✅ Ícono del rol **${rol.name}** actualizado a ${emojiInput}`
        );
      }

    } catch (error) {
      console.error(
        'Error en !seticono:',
        error
      );

      await message.reply(
        '❌ No se pudo establecer el ícono. Asegúrate de que el emoji sea válido y el servidor tenga **boost nivel 2 o superior**.'
      );
    }
  }
};