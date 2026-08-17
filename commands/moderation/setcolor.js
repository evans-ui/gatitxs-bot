const {
  SlashCommandBuilder,
  PermissionsBitField
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setcolor')
    .setDescription('Cambia el color de un rol')

    .setDefaultMemberPermissions(
      PermissionsBitField.Flags.ManageRoles
    )

    .addRoleOption(option =>
      option
        .setName('rol')
        .setDescription(
          'El rol al que quieres cambiar el color'
        )
        .setRequired(true)
    )

    .addStringOption(option =>
      option
        .setName('color')
        .setDescription(
          'Color hexadecimal (por ejemplo, #ff0000)'
        )
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      const rol =
        interaction.options.getRole('rol');

      const color =
        interaction.options.getString('color');

      if (
        !interaction.guild.members.me
          .permissions.has('ManageRoles')
      ) {
        return interaction.reply({
          content:
            '❌ No tengo permisos para editar roles.',
          ephemeral: true
        });
      }

      const botRole =
        interaction.guild.members.me.roles.highest;

      if (botRole.position <= rol.position) {
        return interaction.reply({
          content:
            '❌ No puedo modificar este rol porque está por encima de mi rol más alto.',
          ephemeral: true
        });
      }

      const hexRegex =
        /^#?([a-fA-F0-9]{6})$/;

      const match =
        color.match(hexRegex);

      if (!match) {
        return interaction.reply({
          content:
            '❌ El color debe estar en formato hexadecimal. Ejemplo: `#00ff00` o `00ff00`.',
          ephemeral: true
        });
      }

      const hexColor =
        `#${match[1]}`;

      await rol.setColor(hexColor);

      await interaction.reply(
        `✅ Color del rol **${rol.name}** cambiado a \`${hexColor}\`.`
      );

    } catch (error) {
      console.error(
        'Error en /setcolor:',
        error
      );

      await interaction.reply({
        content:
          '❌ Ocurrió un error al cambiar el color del rol.',
        ephemeral: true
      });
    }
  }
};