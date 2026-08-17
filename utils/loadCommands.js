const fs = require('fs');
const path = require('path');

function loadCommands(client) {
  const commandsPath = path.join(__dirname, '..', 'commands');

  function readCommandFiles(directory) {
    const files = fs.readdirSync(directory);

    for (const file of files) {
      const fullPath = path.join(directory, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        readCommandFiles(fullPath);
        continue;
      }

      if (!file.endsWith('.js')) continue;

      const command = require(fullPath);

      if (!command.data || !command.execute) {
        console.warn(`⚠️ Comando inválido ignorado: ${fullPath}`);
        continue;
      }

      client.commands.set(command.data.name, command);

      console.log(`📦 Comando cargado: /${command.data.name}`);
    }
  }

  readCommandFiles(commandsPath);

  console.log(`✅ ${client.commands.size} comandos cargados.`);
}

module.exports = loadCommands;