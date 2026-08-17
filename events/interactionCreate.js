module.exports = function registerInteractionEvent(client) {
  client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
      console.warn(`⚠️ No se encontró el comando /${interaction.commandName}`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(
        `❌ Error ejecutando /${interaction.commandName}:`,
        error
      );

      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.editReply(
            '❌ Ocurrió un error al ejecutar este comando.'
          );
        } else {
          await interaction.reply({
            content: '❌ Ocurrió un error al ejecutar este comando.',
            ephemeral: true
          });
        }
      } catch {}
    }
  });
};