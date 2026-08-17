module.exports = {
  name: 'setcolor',

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

      const color = args[1];

      if (!rol) {
        return message.reply(
          '❌ Uso: `g.setcolor @rol #ff0000`'
        );
      }

      if (!color) {
        return message.reply(
          '❌ Debes especificar un color. Ejemplo: `g.setcolor @rol #ff0000`'
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

      const hexRegex =
        /^#?([a-fA-F0-9]{6})$/;

      const match =
        color.match(hexRegex);

      if (!match) {
        return message.reply(
          '❌ El color debe estar en formato hexadecimal. Ejemplo: `#00ff00` o `00ff00`.'
        );
      }

      const hexColor =
        `#${match[1]}`;

      await rol.setColor(hexColor);

      await message.reply(
        `✅ Color del rol **${rol.name}** cambiado a \`${hexColor}\`.`
      );

    } catch (error) {
      console.error(
        'Error en !setcolor:',
        error
      );

      await message.reply(
        '❌ Ocurrió un error al cambiar el color del rol.'
      );
    }
  }
};