const {
  SlashCommandBuilder,
  PermissionsBitField
} = require('discord.js');

const fetch = (...args) =>
  import('node-fetch')
    .then(({ default: fetch }) => fetch(...args));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('seticono')
    .setDescription(
      'Establece un emoji como ícono de un rol'
    )

    .setDefaultMemberPermissions(
      PermissionsBitField.Flags.ManageRoles
    )

    .addRoleOption(option =>
      option
        .setName('rol')
        .setDescription(
          'El rol al que se le pondrá el ícono'
        )
        .setRequired(true)
    )

    .addStringOption(option =>
      option
        .setName('emoji')
        .setDescription(
          'El emoji que se usará como ícono del rol'
        )
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      const rol =
        interaction.options.getRole('rol');

      const emojiInput =
        interaction.options.getString('emoji');

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

      const customEmojiRegex =
        /^<a?:\w+:(\d+)>$/;

      const match =
        emojiInput.match(customEmojiRegex);

      if (match) {
        const emojiId = match[1];

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

        await interaction.reply(
          `✅ Ícono del rol **${rol.name}** actualizado con emoji personalizado.`
        );

      } else {
        await rol.setIcon(emojiInput);

        await interaction.reply(
          `✅ Ícono del rol **${rol.name}** actualizado a ${emojiInput}`
        );
      }

    } catch (error) {
      console.error(
        'Error en /seticono:',
        error
      );

      await interaction.reply({
        content:
          '❌ No se pudo establecer el ícono. Asegúrate de que el emoji sea válido y el servidor tenga **boost nivel 2 o superior**.',
        ephemeral: true
      });
    }
  }
};