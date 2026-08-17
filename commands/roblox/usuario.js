const { SlashCommandBuilder } = require('discord.js');
const { buscarUsuario } = require('../../utils/roblox');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('usuario')
    .setDescription(
      'Verifica si un nombre de usuario de Roblox está en uso'
    )
    .addStringOption(option =>
      option
        .setName('nombre')
        .setDescription('Nombre de usuario de Roblox')
        .setRequired(true)
    ),

  async execute(interaction) {
    const nombre =
      interaction.options.getString('nombre');

    await interaction.deferReply();

    try {
      const usuario =
        await buscarUsuario(nombre);

      if (usuario) {
        return interaction.editReply(
          `❌ El nombre **${nombre}** está en uso por el usuario con ID **${usuario.id}**.`
        );
      }

      return interaction.editReply(
        `✅ El nombre **${nombre}** está disponible.`
      );

    } catch (err) {
      console.error(
        'Error en /usuario:',
        err.message
      );

      return interaction.editReply(
        '⚠️ Ocurrió un error al verificar el nombre de usuario.'
      );
    }
  }
};