const {
  SlashCommandBuilder,
  EmbedBuilder
} = require('discord.js');

/*
 * ============================================================
 * CONFIGURACIÓN
 * ============================================================
 */

const MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 3000;

/*
 * ============================================================
 * ESPERAR
 * ============================================================
 */

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

/*
 * ============================================================
 * OBTENER TIEMPO DE RETRY-AFTER
 * ============================================================
 */

function getRetryDelay(response) {
  const retryAfter =
    response.headers.get('retry-after');

  if (retryAfter) {
    const seconds =
      Number(retryAfter);

    if (!Number.isNaN(seconds)) {
      return Math.max(
        seconds * 1000,
        DEFAULT_RETRY_DELAY
      );
    }
  }

  return DEFAULT_RETRY_DELAY;
}

/*
 * ============================================================
 * FETCH CON REINTENTOS
 * ============================================================
 */

async function fetchWithRetry(
  url,
  options = {},
  retries = MAX_RETRIES
) {
  let lastResponse = null;

  for (
    let attempt = 0;
    attempt <= retries;
    attempt++
  ) {
    try {
      const response =
        await fetch(url, options);

      lastResponse = response;

      /*
       * Petición correcta.
       */

      if (response.ok) {
        return response;
      }

      /*
       * Rate limit.
       */

      if (
        response.status === 429
      ) {
        if (attempt >= retries) {
          return response;
        }

        const delay =
          getRetryDelay(response);

        console.log(
          `[userhistory] Roblox respondió 429. ` +
          `Esperando ${Math.ceil(delay / 1000)} segundos...`
        );

        await sleep(delay);

        continue;
      }

      /*
       * Otros errores.
       */

      return response;

    } catch (error) {
      if (attempt >= retries) {
        throw error;
      }

      const delay =
        DEFAULT_RETRY_DELAY *
        (attempt + 1);

      console.log(
        `[userhistory] Error de conexión. ` +
        `Reintentando en ${Math.ceil(delay / 1000)} segundos...`
      );

      await sleep(delay);
    }
  }

  return lastResponse;
}

/*
 * ============================================================
 * BUSCAR USUARIO POR NOMBRE
 * ============================================================
 */

async function getRobloxUser(
  username
) {
  const response =
    await fetchWithRetry(
      'https://users.roblox.com/v1/usernames/users',
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          'User-Agent':
            'GatitxsBot/1.0'
        },

        body: JSON.stringify({
          usernames: [username],
          excludeBannedUsers: false
        })
      }
    );

  if (!response) {
    throw new Error(
      'No hubo respuesta de Roblox.'
    );
  }

  if (
    response.status === 429
  ) {
    throw new Error(
      'RATE_LIMIT_USERS'
    );
  }

  if (!response.ok) {
    throw new Error(
      `Roblox respondió con HTTP ${response.status}`
    );
  }

  const data =
    await response.json();

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
 * OBTENER HISTORIAL
 * ============================================================
 *
 * Probamos primero roproxy.
 * Si no funciona, probamos directamente Roblox.
 * ============================================================
 */

async function getUsernameHistory(
  userId
) {
  const endpoints = [
    `https://users.roproxy.com/v1/users/${userId}/username-history`,
    `https://users.roblox.com/v1/users/${userId}/username-history`
  ];

  let lastError = null;

  for (const url of endpoints) {
    try {
      console.log(
        `[userhistory] Consultando: ${url}`
      );

      const response =
        await fetchWithRetry(
          url,
          {
            method: 'GET',

            headers: {
              'Accept':
                'application/json',
              'User-Agent':
                'GatitxsBot/1.0'
            }
          }
        );

      if (!response) {
        continue;
      }

      /*
       * Si el endpoint está limitado,
       * probamos el siguiente.
       */

      if (
        response.status === 429
      ) {
        lastError =
          new Error(
            `HTTP 429 en ${url}`
          );

        continue;
      }

      /*
       * Si devuelve otro error,
       * probamos el siguiente endpoint.
       */

      if (!response.ok) {
        lastError =
          new Error(
            `HTTP ${response.status} en ${url}`
          );

        continue;
      }

      const data =
        await response.json();

      if (
        !data ||
        !Array.isArray(data.data)
      ) {
        lastError =
          new Error(
            'Respuesta inválida de Roblox.'
          );

        continue;
      }

      return data.data;

    } catch (error) {
      console.error(
        `[userhistory] Error consultando ${url}:`,
        error
      );

      lastError = error;
    }
  }

  throw (
    lastError ||
    new Error(
      'No fue posible obtener el historial.'
    )
  );
}

/*
 * ============================================================
 * COMANDO
 * ============================================================
 */

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userhistory')
    .setDescription(
      'Muestra el historial de nombres de un usuario de Roblox'
    )

    .addStringOption(option =>
      option
        .setName('usuario')
        .setDescription(
          'Nombre de usuario de Roblox'
        )
        .setRequired(true)
    ),

  async execute(interaction) {
    const username =
      interaction.options
        .getString('usuario')
        .trim();

    await interaction.deferReply();

    try {
      /*
       * ========================================================
       * BUSCAR USUARIO
       * ========================================================
       */

      const user =
        await getRobloxUser(
          username
        );

      if (!user) {
        return interaction.editReply({
          content:
            `No se encontró ningún usuario de Roblox llamado **${username}**.`
        });
      }

      const userId =
        user.id;

      const currentUsername =
        user.name;

      /*
       * ========================================================
       * HISTORIAL
       * ========================================================
       */

      const history =
        await getUsernameHistory(
          userId
        );

      /*
       * ========================================================
       * NOMBRES ANTERIORES
       * ========================================================
       */

      const previousNames =
        history
          .map(entry => entry.name)
          .filter(
            name =>
              name.toLowerCase() !==
              currentUsername.toLowerCase()
          );

      /*
       * ========================================================
       * LISTA
       * ========================================================
       */

      let nameList =
        'No tiene nombres anteriores registrados.';

      if (
        previousNames.length > 0
      ) {
        nameList =
          previousNames
            .map(
              (name, index) =>
                `**${index + 1}.** ${name}`
            )
            .join('\n');
      }

      /*
       * ========================================================
       * EMBED
       * ========================================================
       */

      const embed =
        new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle('User History')
          .setDescription(
            `Historial de nombres de **${currentUsername}**.`
          )

          .addFields(
            {
              name: 'Nombre actual',
              value:
                `**${currentUsername}**`,
              inline: false
            },

            {
              name: 'Nombres anteriores',
              value: nameList,
              inline: false
            },

            {
              name:
                'Total de nombres anteriores',
              value:
                `${previousNames.length}`,
              inline: false
            }
          )

          .setFooter({
            text:
              `User ID: ${userId}`
          })

          .setTimestamp();

      /*
       * ========================================================
       * RESPUESTA
       * ========================================================
       */

      return interaction.editReply({
        embeds: [embed]
      });

    } catch (error) {
      console.error(
        'Error en /userhistory:',
        error
      );

      /*
       * ========================================================
       * MENSAJE ESPECÍFICO PARA RATE LIMIT
       * ========================================================
       */

      if (
        error.message ===
        'RATE_LIMIT_USERS'
      ) {
        return interaction.editReply({
          content:
            'Roblox está limitando temporalmente las consultas. Espera unos segundos e inténtalo nuevamente.'
        });
      }

      /*
       * ========================================================
       * ERROR GENERAL
       * ========================================================
       */

      return interaction.editReply({
        content:
          'No fue posible obtener el historial de nombres de Roblox en este momento.'
      });
    }
  }
};