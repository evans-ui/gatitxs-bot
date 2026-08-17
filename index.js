require('dotenv').config();

const { Client, GatewayIntentBits, Collection } = require('discord.js');

const expressServer = require('./server/express');
const loadCommands = require('./utils/loadCommands');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Colección de slash commands
client.commands = new Collection();

// Cargar comandos automáticamente
loadCommands(client);

// Eventos
require('./events/ready')(client);
require('./events/interactionCreate')(client);
require('./events/messageCreate')(client);

// Iniciar servidor Express
expressServer();

// Iniciar bot
client.login(process.env.DISCORD_TOKEN);