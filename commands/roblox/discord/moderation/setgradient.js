const {
  SlashCommandBuilder,
  PermissionsBitField
} = require('discord.js');

const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setgradient')
    .setDescription(
      'Aplica un degradado de dos colores al ícono de un rol'
    )

    .setDefaultMemberPermissions(
      PermissionsBitField.Flags.ManageRoles
    )

    .addRoleOption(option =>
      option
        .setName('rol')
        .setDescription(
          'El rol al que aplicarás el degradado'
        )
        .setRequired(true)
    )

    .addStringOption(option =>
      option
        .setName('color1')
        .setDescription(
          'Primer color hexadecimal (ej: #ff0000)'
        )
        .setRequired(true)
    )

    .addStringOption(option =>
      option
        .setName('color2')
        .setDescription(
          'Segundo color hexadecimal (ej: #0000ff)'
        )
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      const rol =
        interaction.options.getRole('rol');

      const color1 =
        interaction.options.getString('color1');

      const color2 =
        interaction.options.getString('color2');

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

      const match1 =
        color1.match(hexRegex);

      const match2 =
        color2.match(hexRegex);

      if (!match1 || !match2) {
        return interaction.reply({
          content:
            '❌ Ambos colores deben estar en formato hexadecimal. Ejemplo: `#ff0000` o `ff0000`.',
          ephemeral: true
        });
      }

      const colorInt1 =
        parseInt(match1[1], 16);

      const colorInt2 =
        parseInt(match2[1], 16);

      await interaction.deferReply();

      await rol.edit({
        color: colorInt1,
        unicodeEmoji: null
      });

      try {
        await axios.patch(
          `https://discord.com/api/v10/guilds/${interaction.guild.id}/roles/${rol.id}`,

          {
            color: colorInt1,
            color_two: colorInt2
          },

          {
            headers: {
              Authorization:
                `Bot ${process.env.DISCORD_TOKEN}`,

              'Content-Type':
                'application/json'
            }
          }
        );

        await interaction.editReply(
          `✅ Degradado aplicado al rol **${rol.name}**\n` +
          `Colores: \`#${match1[1]}\` → \`#${match2[1]}\`\n\n` +
          `**Nota:** El servidor necesita **boost nivel 3** para ver el degradado.`
        );

      } catch (apiError) {
        console.error(
          'Error al aplicar gradiente con API:',
          apiError.response?.data ||
          apiError.message
        );

        await interaction.editReply(
          'No se pudo aplicar el degradado completo.'
        );
      }

    } catch (error) {
      console.error(
        'Error en /setgradient:',
        error
      );

      if (
        interaction.deferred ||
        interaction.replied
      ) {
        await interaction.editReply(
          '❌ Ocurrió un error al aplicar el degradado.'
        );
      } else {
        await interaction.reply({
          content:
            '❌ Ocurrió un error al aplicar el degradado.',
          ephemeral: true
        });
      }
    }
  }
};