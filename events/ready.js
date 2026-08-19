const {
  ActivityType
} = require('discord.js');

const {
  syncExistingBoosters
} = require('./guildMemberUpdate');


module.exports =
  function registerReadyEvent(client) {

    client.once(
      'ready',
      async () => {

        console.log(
          `✅ Bot conectado como ${client.user.tag}`
        );


        /*
         * ====================================================
         * ESTADO DEL BOT
         * ====================================================
         */

        client.user.setActivity(
          'Roblox',
          {
            type:
              ActivityType.Watching
          }
        );


        /*
         * ====================================================
         * SINCRONIZAR BOOSTERS
         * ====================================================
         */

        const guildId =
          process.env.GUILD_ID;


        if (!guildId) {

          console.log(
            '⚠️ No hay GUILD_ID configurado. Se omitió la sincronización de boosters.'
          );

          return;

        }


        const guild =
          client.guilds.cache.get(
            guildId
          );


        if (!guild) {

          console.error(
            `❌ No encontré el servidor ${guildId}.`
          );

          return;

        }


        try {

          await syncExistingBoosters(
            guild
          );

        } catch (error) {

          console.error(
            '❌ Error sincronizando boosters al iniciar:',
            error
          );

        }

      }
    );

  };