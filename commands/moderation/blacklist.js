const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} = require('discord.js');

const fs = require('fs');
const path = require('path');

/*
 * ============================================================
 * CONFIGURACIÓN
 * ============================================================
 */

const DATA_DIR = path.join(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'blacklist.json');

const USERS_PER_PAGE = 10;

/*
 * ============================================================
 * ASEGURAR QUE EXISTAN LA CARPETA Y EL ARCHIVO
 * ============================================================
 */

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, {
      recursive: true
    });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(
        {
          guilds: {}
        },
        null,
        2
      ),
      'utf8'
    );
  }
}

/*
 * ============================================================
 * LEER DATOS
 * ============================================================
 */

function loadData() {
  ensureDataFile();

  try {
    const rawData = fs.readFileSync(
      DATA_FILE,
      'utf8'
    );

    const data = JSON.parse(rawData);

    if (!data.guilds) {
      data.guilds = {};
    }

    return data;
  } catch (error) {
    console.error(
      'Error leyendo blacklist.json:',
      error
    );

    return {
      guilds: {}
    };
  }
}

/*
 * ============================================================
 * GUARDAR DATOS
 * ============================================================
 */

function saveData(data) {
  ensureDataFile();

  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(data, null, 2),
    'utf8'
  );
}

/*
 * ============================================================
 * OBTENER BLACKLIST DEL SERVIDOR
 * ============================================================
 */

function getGuildBlacklist(data, guildId) {
  if (!data.guilds[guildId]) {
    data.guilds[guildId] = {
      messageId: null,
      channelId: null,
      users: []
    };
  }

  if (!Array.isArray(data.guilds[guildId].users)) {
    data.guilds[guildId].users = [];
  }

  return data.guilds[guildId];
}

/*
 * ============================================================
 * BUSCAR USUARIO EN ROBLOX
 * ============================================================
 */

async function getRobloxUser(username) {
  const response = await fetch(
    'https://users.roblox.com/v1/usernames/users',
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json'
      },

      body: JSON.stringify({
        usernames: [username],
        excludeBannedUsers: false
      })
    }
  );

  if (!response.ok) {
    throw new Error(
      `Roblox API respondió con HTTP ${response.status}`
    );
  }

  const data = await response.json();

  if (
    !data ||
    !Array.isArray(data.data) ||
    data.data.length === 0
  ) {
    return null;
  }

  return data.data[0];
}

/*
 * ============================================================
 * CREAR EMBED
 * ============================================================
 */

function createBlacklistEmbed(
  guild,
  blacklist,
  page = 1
) {
  const users = blacklist.users;

  const totalUsers = users.length;

  const totalPages = Math.max(
    1,
    Math.ceil(
      totalUsers / USERS_PER_PAGE
    )
  );

  if (page < 1) {
    page = 1;
  }

  if (page > totalPages) {
    page = totalPages;
  }

  const startIndex =
    (page - 1) * USERS_PER_PAGE;

  const pageUsers = users.slice(
    startIndex,
    startIndex + USERS_PER_PAGE
  );

  let userList =
    'No hay usuarios de Roblox en la blacklist.';

  if (pageUsers.length > 0) {
    userList = pageUsers
      .map((entry, index) => {
        const number =
          startIndex + index + 1;

        return (
          `**${number}. ${entry.username}**\n` +
          `User ID: \`${entry.userId}\`\n` +
          `Juego: ${entry.game}`
        );
      })
      .join('\n\n');
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('Blacklist')
    .setDescription(
      `Lista de usuarios de Roblox registrados en **${guild.name}**.\n\n` +
      userList
    )
    .addFields({
      name: 'Información',
      value:
        `**Total:** ${totalUsers}\n` +
        `**Página:** ${page}/${totalPages}`,
      inline: false
    })
    .setFooter({
      text: `Servidor: ${guild.name}`
    })
    .setTimestamp();

  const iconURL = guild.iconURL({
    extension: 'png',
    size: 256
  });

  if (iconURL) {
    embed.setThumbnail(iconURL);
  }

  return {
    embed,
    page,
    totalPages
  };
}

/*
 * ============================================================
 * ENCONTRAR EL MENSAJE DE BLACKLIST
 * ============================================================
 */

async function getBlacklistMessage(
  guild,
  blacklist
) {
  if (
    !blacklist.channelId ||
    !blacklist.messageId
  ) {
    return null;
  }

  try {
    const channel =
      await guild.channels.fetch(
        blacklist.channelId
      );

    if (
      !channel ||
      !channel.isTextBased()
    ) {
      return null;
    }

    const message =
      await channel.messages.fetch(
        blacklist.messageId
      );

    return message;
  } catch (error) {
    return null;
  }
}

/*
 * ============================================================
 * COMANDO
 * ============================================================
 */

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blacklist')
    .setDescription(
      'Administra la lista negra de usuarios de Roblox'
    )

    /*
     * --------------------------------------------------------
     * ADD
     * --------------------------------------------------------
     */

    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription(
          'Añade un usuario de Roblox a la blacklist'
        )
        .addStringOption(option =>
          option
            .setName('usuario')
            .setDescription(
              'Nombre de usuario de Roblox'
            )
            .setRequired(true)
            .setMaxLength(20)
        )
        .addStringOption(option =>
          option
            .setName('juego')
            .setDescription(
              'Juego relacionado con la blacklist'
            )
            .setRequired(true)
            .setMaxLength(100)
        )
    )

    /*
     * --------------------------------------------------------
     * REMOVE
     * --------------------------------------------------------
     */

    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription(
          'Elimina un usuario de Roblox de la blacklist'
        )
        .addStringOption(option =>
          option
            .setName('usuario')
            .setDescription(
              'Nombre de usuario de Roblox'
            )
            .setRequired(true)
            .setMaxLength(20)
        )
    )

    /*
     * --------------------------------------------------------
     * LIST
     * --------------------------------------------------------
     */

    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription(
          'Muestra la blacklist de Roblox'
        )
        .addIntegerOption(option =>
          option
            .setName('pagina')
            .setDescription(
              'Página que quieres consultar'
            )
            .setMinValue(1)
            .setRequired(false)
        )
    )

    /*
     * --------------------------------------------------------
     * PERMISOS
     * --------------------------------------------------------
     */

    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageGuild
    ),

  async execute(interaction) {
    /*
     * ========================================================
     * COMPROBAR SERVIDOR
     * ========================================================
     */

    if (!interaction.guild) {
      return interaction.reply({
        content:
          'Este comando solo puede utilizarse dentro de un servidor.',
        ephemeral: true
      });
    }

    /*
     * ========================================================
     * COMPROBAR PERMISOS
     * ========================================================
     */

    if (
      !interaction.memberPermissions.has(
        PermissionFlagsBits.ManageGuild
      )
    ) {
      return interaction.reply({
        content:
          'No tienes permiso para utilizar este comando.',
        ephemeral: true
      });
    }

    /*
     * ========================================================
     * DATOS
     * ========================================================
     */

    const guild = interaction.guild;

    const data = loadData();

    const blacklist =
      getGuildBlacklist(
        data,
        guild.id
      );

    const subcommand =
      interaction.options.getSubcommand();

    /*
     * ========================================================
     * ADD
     * ========================================================
     */

    if (subcommand === 'add') {
      const username =
        interaction.options.getString(
          'usuario'
        ).trim();

      const game =
        interaction.options.getString(
          'juego'
        ).trim();

      /*
       * Como tenemos que consultar Roblox,
       * hacemos defer para evitar que Discord
       * considere que tardamos demasiado.
       */

      await interaction.deferReply({
        ephemeral: true
      });

      /*
       * --------------------------------------------------------
       * BUSCAR USUARIO EN ROBLOX
       * --------------------------------------------------------
       */

      let robloxUser;

      try {
        robloxUser =
          await getRobloxUser(username);
      } catch (error) {
        console.error(
          'Error consultando Roblox:',
          error
        );

        return interaction.editReply({
          content:
            'No fue posible consultar Roblox en este momento. Inténtalo nuevamente.'
        });
      }

      /*
       * --------------------------------------------------------
       * USUARIO NO ENCONTRADO
       * --------------------------------------------------------
       */

      if (!robloxUser) {
        return interaction.editReply({
          content:
            `No se encontró ningún usuario de Roblox llamado **${username}**.`
        });
      }

      /*
       * --------------------------------------------------------
       * DATOS REALES DE ROBLOX
       * --------------------------------------------------------
       */

      const robloxUserId =
        String(robloxUser.id);

      const robloxUsername =
        robloxUser.name;

      /*
       * --------------------------------------------------------
       * COMPROBAR SI YA EXISTE
       * --------------------------------------------------------
       */

      const alreadyBlacklisted =
        blacklist.users.some(
          entry =>
            String(entry.userId) ===
            robloxUserId
        );

      if (alreadyBlacklisted) {
        return interaction.editReply({
          content:
            `**${robloxUsername}** ya se encuentra en la blacklist.`
        });
      }

      /*
       * --------------------------------------------------------
       * GUARDAR USUARIO
       * --------------------------------------------------------
       *
       * "game" es simplemente texto.
       * No hacemos ninguna consulta a Roblox
       * para comprobar el juego.
       */

      blacklist.users.push({
        userId: robloxUserId,
        username: robloxUsername,
        game: game
      });

      /*
       * --------------------------------------------------------
       * GUARDAR DATOS
       * --------------------------------------------------------
       */

      saveData(data);

      /*
       * --------------------------------------------------------
       * BUSCAR EMBED EXISTENTE
       * --------------------------------------------------------
       */

      let message =
        await getBlacklistMessage(
          guild,
          blacklist
        );

      /*
       * --------------------------------------------------------
       * SI NO EXISTE, CREARLO
       * --------------------------------------------------------
       */

      if (!message) {
        const result =
          createBlacklistEmbed(
            guild,
            blacklist,
            1
          );

        message =
          await interaction.channel.send({
            embeds: [result.embed]
          });

        blacklist.channelId =
          interaction.channel.id;

        blacklist.messageId =
          message.id;

        saveData(data);
      }

      /*
       * --------------------------------------------------------
       * SI EXISTE, ACTUALIZARLO
       * --------------------------------------------------------
       */

      else {
        const result =
          createBlacklistEmbed(
            guild,
            blacklist,
            1
          );

        await message.edit({
          embeds: [result.embed]
        });
      }

      /*
       * --------------------------------------------------------
       * CONFIRMACIÓN
       * --------------------------------------------------------
       */

      return interaction.editReply({
        content:
          `Se añadió **${robloxUsername}** a la blacklist de Roblox.\n` +
          `User ID: \`${robloxUserId}\`\n` +
          `Juego: ${game}`
      });
    }

    /*
     * ========================================================
     * REMOVE
     * ========================================================
     */

    if (subcommand === 'remove') {
      const username =
        interaction.options.getString(
          'usuario'
        ).trim();

      await interaction.deferReply({
        ephemeral: true
      });

      /*
       * Intentamos encontrar el usuario en Roblox.
       */

      let robloxUser = null;

      try {
        robloxUser =
          await getRobloxUser(username);
      } catch (error) {
        console.error(
          'Error consultando Roblox:',
          error
        );
      }

      let index = -1;

      /*
       * --------------------------------------------------------
       * BUSCAR POR USER ID
       * --------------------------------------------------------
       */

      if (robloxUser) {
        index =
          blacklist.users.findIndex(
            entry =>
              String(entry.userId) ===
              String(robloxUser.id)
          );
      }

      /*
       * --------------------------------------------------------
       * SI NO SE PUDO RESOLVER EN ROBLOX,
       * BUSCAR POR NOMBRE GUARDADO
       * --------------------------------------------------------
       */

      if (index === -1) {
        index =
          blacklist.users.findIndex(
            entry =>
              entry.username.toLowerCase() ===
              username.toLowerCase()
          );
      }

      /*
       * --------------------------------------------------------
       * NO EXISTE
       * --------------------------------------------------------
       */

      if (index === -1) {
        return interaction.editReply({
          content:
            `**${username}** no se encuentra en la blacklist.`
        });
      }

      /*
       * Guardamos los datos antes de eliminar.
       */

      const removedUser =
        blacklist.users[index];

      /*
       * --------------------------------------------------------
       * ELIMINAR
       * --------------------------------------------------------
       */

      blacklist.users.splice(
        index,
        1
      );

      /*
       * --------------------------------------------------------
       * GUARDAR
       * --------------------------------------------------------
       */

      saveData(data);

      /*
       * --------------------------------------------------------
       * BUSCAR EMBED
       * --------------------------------------------------------
       */

      let message =
        await getBlacklistMessage(
          guild,
          blacklist
        );

      /*
       * --------------------------------------------------------
       * SI NO EXISTE, CREAR UNO NUEVO
       * --------------------------------------------------------
       */

      if (!message) {
        const result =
          createBlacklistEmbed(
            guild,
            blacklist,
            1
          );

        message =
          await interaction.channel.send({
            embeds: [result.embed]
          });

        blacklist.channelId =
          interaction.channel.id;

        blacklist.messageId =
          message.id;

        saveData(data);
      }

      /*
       * --------------------------------------------------------
       * ACTUALIZAR EMBED
       * --------------------------------------------------------
       */

      else {
        const result =
          createBlacklistEmbed(
            guild,
            blacklist,
            1
          );

        await message.edit({
          embeds: [result.embed]
        });
      }

      /*
       * --------------------------------------------------------
       * CONFIRMACIÓN
       * --------------------------------------------------------
       */

      return interaction.editReply({
        content:
          `Se eliminó **${removedUser.username}** de la blacklist de Roblox.`
      });
    }

    /*
     * ========================================================
     * LIST
     * ========================================================
     */

    if (subcommand === 'list') {
      const requestedPage =
        interaction.options.getInteger(
          'pagina'
        ) || 1;

      /*
       * Buscar mensaje existente.
       */

      let message =
        await getBlacklistMessage(
          guild,
          blacklist
        );

      /*
       * Crear embed.

       */

      const result =
        createBlacklistEmbed(
          guild,
          blacklist,
          requestedPage
        );

      /*
       * --------------------------------------------------------
       * SI NO EXISTE, CREARLO
       * --------------------------------------------------------
       */

      if (!message) {
        message =
          await interaction.channel.send({
            embeds: [result.embed]
          });

        blacklist.channelId =
          interaction.channel.id;

        blacklist.messageId =
          message.id;

        saveData(data);
      }

      /*
       * --------------------------------------------------------
       * SI EXISTE, ACTUALIZARLO
       * --------------------------------------------------------
       */

      else {
        await message.edit({
          embeds: [result.embed]
        });
      }

      /*
       * --------------------------------------------------------
       * RESPUESTA PRIVADA
       * --------------------------------------------------------
       */

      return interaction.reply({
        content:
          `Blacklist actualizada. Página ${result.page}/${result.totalPages}.`,
        ephemeral: true
      });
    }
  }
};