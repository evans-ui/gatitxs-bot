require('dotenv').config();

const fs = require('fs');
const path = require('path');

const {
  REST,
  Routes
} = require('discord.js');

const commands = [];

const commandsPath =
  path.join(__dirname, 'commands');

function readCommands(directory) {
  const files =
    fs.readdirSync(directory);

  for (const file of files) {
    const fullPath =
      path.join(directory, file);

    const stat =
      fs.statSync(fullPath);

    if (stat.isDirectory()) {
      readCommands(fullPath);
      continue;
    }

    if (!file.endsWith('.js')) continue;

    const command =
      require(fullPath);

    if (!command.data) {
      console.warn(
        `⚠️ Archivo ignorado: ${fullPath}`
      );

      continue;
    }

    commands.push(
      command.data.toJSON()
    );
  }
}

readCommands(commandsPath);

console.log(
  `📦 Se encontraron ${commands.length} comandos.`
);

const rest =
  new REST({ version: '10' })
    .setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(
      '⏳ Registrando comandos...'
    );

    const route =
      process.env.GUILD_ID
        ? Routes.applicationGuildCommands(
            process.env.CLIENT_ID,
            process.env.GUILD_ID
          )
        : Routes.applicationCommands(
            process.env.CLIENT_ID
          );

    await rest.put(route, {
      body: commands
    });

    console.log(
      '✅ Comandos registrados correctamente.'
    );

  } catch (error) {
    console.error(
      '❌ Error registrando comandos:',
      error
    );
  }
})();