const fs = require('fs');
const path = require('path');

module.exports = function registerMessageEvent(client) {
  const prefix = 'g.';

  const prefixCommands = new Map();

  const commandsPath =
    path.join(__dirname, '..', 'prefix');

  const files =
    fs.readdirSync(commandsPath);

  for (const file of files) {
    if (!file.endsWith('.js')) continue;

    const command =
      require(path.join(commandsPath, file));

    prefixCommands.set(
      command.name,
      command
    );

    console.log(
      `📦 Comando de prefijo cargado: ${prefix}${command.name}`
    );
  }

  client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (!message.content.startsWith(prefix)) {
      return;
    }

    const args =
      message.content
        .slice(prefix.length)
        .trim()
        .split(/ +/);

    const commandName =
      args.shift().toLowerCase();

    const command =
      prefixCommands.get(commandName);

    if (!command) return;

    try {
      await command.execute(
        message,
        args
      );
    } catch (error) {
      console.error(
        `❌ Error ejecutando ${prefix}${commandName}:`,
        error
      );

      try {
        await message.reply(
          '❌ Ocurrió un error al ejecutar este comando.'
        );
      } catch {}
    }
  });
};