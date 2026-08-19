require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  Collection
} = require('discord.js');

const expressServer =
  require('./server/express');

const loadCommands =
  require('./utils/loadCommands');


const client = new Client({

  intents: [

    GatewayIntentBits.Guilds,

    GatewayIntentBits.GuildMessages,

    GatewayIntentBits.MessageContent,

    GatewayIntentBits.GuildMembers

  ]

});


/*
 * ============================================================
 * COLECCIÓN DE SLASH COMMANDS
 * ============================================================
 */

client.commands =
  new Collection();


/*
 * ============================================================
 * CARGAR COMANDOS
 * ============================================================
 */

loadCommands(
  client
);


/*
 * ============================================================
 * EVENTOS
 * ============================================================
 */

require('./events/ready')(
  client
);

require('./events/interactionCreate')(
  client
);

require('./events/messageCreate')(
  client
);

require('./events/guildMemberUpdate')(
  client
);


/*
 * ============================================================
 * EXPRESS
 * ============================================================
 */

expressServer();


/*
 * ============================================================
 * LOGIN
 * ============================================================
 */

client.login(
  process.env.DISCORD_TOKEN
);