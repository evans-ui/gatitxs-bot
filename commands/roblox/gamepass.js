const {
  SlashCommandBuilder,
  EmbedBuilder
} = require('discord.js');

/*
 * ============================================================
 * CONFIGURACIÓN
 * ============================================================
 */

const RETRY_DELAY = 3000;
const MAX_RETRIES = 2;

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
 * FETCH CON MANEJO DE RATE LIMIT
 * ============================================================
 */

async function fetchWithRetry(
  url,
  options = {},
  retries = MAX_RETRIES
) {
  for (
    let attempt = 0;
    attempt <= retries;
    attempt++
  ) {
    try {
      const response =
        await fetch(url, {
          ...options,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'GatitxsBot/1.0',
            ...(options.headers || {})
          }
        });

      /*
       * Petición correcta.
       */

      if (response.ok) {
        return response;
      }

      /*
       * Rate limit.
       */

      if (response.status === 429) {
        if (attempt >= retries) {
          return response;
        }

        const retryAfter =
          response.headers.get(
            'retry-after'
          );

        let delay = RETRY_DELAY;

        if (retryAfter) {
          const seconds =
            Number(retryAfter);

          if (!Number.isNaN(seconds)) {
            delay =
              Math.max(
                seconds * 1000,
                RETRY_DELAY
              );
          }
        }

        console.log(
          `[gamepass] Roblox respondió 429. ` +
          `Reintentando en ${Math.ceil(delay / 1000)} segundos...`
        );

        await sleep(delay);

        continue;
      }

      return response;

    } catch (error) {
      if (attempt >= retries) {
        throw error;
      }

      const delay =
        RETRY_DELAY * (attempt + 1);

      console.log(
        `[gamepass] Error de conexión. ` +
        `Reintentando en ${Math.ceil(delay / 1000)} segundos...`
      );

      await sleep(delay);
    }
  }

  return null;
}

/*
 * ============================================================
 * BUSCAR USUARIO DE ROBLOX
 * ============================================================
 */

async function getRobloxUser(username) {
  const response =
    await fetchWithRetry(
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

  if (!response) {
    throw new Error(
      'NO_RESPONSE'
    );
  }

  if (response.status === 429) {
    throw new Error(
      'RATE_LIMIT'
    );
  }

  if (!response.ok) {
    throw new Error(
      `USER_LOOKUP_${response.status}`
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
 * OBTENER INFORMACIÓN DEL GAME PASS
 * ============================================================
 */

async function getGamePassInfo(gamePassId) {
  const response =
    await fetchWithRetry(
      `https://apis.roblox.com/game-passes/v1/game-passes/${gamePassId}/product-info`,
      {
        method: 'GET'
      }
    );

  if (!response) {
    throw new Error(
      'NO_RESPONSE'
    );
  }

  if (response.status === 404) {
    return null;
  }

  if (response.status === 429) {
    throw new Error(
      'RATE_LIMIT'
    );
  }

  if (!response.ok) {
    throw new Error(
      `GAMEPASS_INFO_${response.status}`
    );
  }

  return await response.json();
}

/*
 * ============================================================
 * COMPROBAR OWNERSHIP
 * ============================================================
 *
 * Este endpoint devuelve información sobre si el usuario
 * tiene el Game Pass.
 *
 * IMPORTANTE:
 * Roblox documenta oficialmente UserOwnsGamePassAsync()
 * para experiencias. La consulta desde un bot externo
 * depende de endpoints web que pueden cambiar o estar
 * limitados por Roblox.
 *
 * ============================================================
 */

async function userOwnsGamePass(
  userId,
  gamePassId
) {
  const url =
    `https://inventory.roblox.com/v1/users/${userId}/items/GamePass/${gamePassId}`;

  const response =
    await fetchWithRetry(
      url,
      {
        method: 'GET'
      }
    );

  if (!response) {
    throw new Error(
      'NO_RESPONSE'
    );
  }

  if (response.status === 429) {
    throw new Error(
      'RATE_LIMIT'
    );
  }

  /*
   * Si el endpoint responde 200,
   * normalmente existe un registro de ownership.
   */

  if (response.ok) {
    const data =
      await response.json();

    return (
      Array.isArray(data.data) &&
      data.data.length > 0
    );
  }

  /*
   * Si no hay ningún elemento,
   * no posee el Game Pass.
   *
   * Algunos endpoints de Roblox pueden devolver
   * 200 con una lista vacía o 404 dependiendo
   * del estado del recurso.
   */

  if (
    response.status === 404
  ) {
    return false;
  }

  /*
   * Otros errores.
   */

  throw new Error(
    `OWNERSHIP_${response.status}`
  );
}

/*
 * ============================================================
 * COMANDO
 * ============================================================
 */

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gamepass')
    .setDescription(
      'Comprueba si un usuario de Roblox posee un Game Pass'
    )

    /*
     * --------------------------------------------------------
     * USUARIO
     * --------------------------------------------------------
     */

    .addStringOption(option =>
      option
        .setName('usuario')
        .setDescription(
          'Nombre de usuario de Roblox'
        )
        .setRequired(true)
        .setMaxLength(20)
    )

    /*
     * --------------------------------------------------------
     * GAME PASS ID
     * --------------------------------------------------------
     */

    .addStringOption(option =>
      option
        .setName('id')
        .setDescription(
          'ID del Game Pass'
        )
        .setRequired(true)
    ),

  async execute(interaction) {
    /*
     * ========================================================
     * DATOS
     * ========================================================
     */

    const username =
      interaction.options
        .getString('usuario')
        .trim();

    const gamePassId =
      interaction.options
        .getString('id')
        .trim();

    /*
     * ========================================================
     * VALIDAR ID
     * ========================================================
     */

    if (!/^\d+$/.test(gamePassId)) {
      return interaction.reply({
        content:
          'El ID del Game Pass debe contener únicamente números.',
        ephemeral: true
      });
    }

    /*
     * ========================================================
     * RESPUESTA DIFERIDA
     * ========================================================
     */

    await interaction.deferReply();

    try {
      /*
       * ======================================================
       * BUSCAR USUARIO
       * ======================================================
       */

      const robloxUser =
        await getRobloxUser(
          username
        );

      if (!robloxUser) {
        return interaction.editReply({
          content:
            `No se encontró ningún usuario de Roblox llamado **${username}**.`
        });
      }

      const userId =
        String(robloxUser.id);

      const currentUsername =
        robloxUser.name;

      /*
       * ======================================================
       * OBTENER INFORMACIÓN DEL GAME PASS
       * ======================================================
       */

      const gamePass =
        await getGamePassInfo(
          gamePassId
        );

      if (!gamePass) {
        return interaction.editReply({
          content:
            `No se encontró ningún Game Pass con el ID \`${gamePassId}\`.`
        });
      }

      /*
       * ======================================================
       * COMPROBAR OWNERSHIP
       * ======================================================
       */

      const ownsGamePass =
        await userOwnsGamePass(
          userId,
          gamePassId
        );

      /*
       * ======================================================
       * DATOS DEL GAME PASS
       * ======================================================
       */

      const gamePassName =
        gamePass.Name ||
        'Game Pass';

      /*
       * ======================================================
       * ESTADO
       * ======================================================
       */

      const status =
        ownsGamePass
          ? 'Posee el Game Pass'
          : 'No posee el Game Pass';

      /*
       * ======================================================
       * EMBED
       * ======================================================
       */

      const embed =
        new EmbedBuilder()
          .setColor(
            ownsGamePass
              ? 0x57F287
              : 0xED4245
          )
          .setTitle(
            'Game Pass Check'
          )
          .setDescription(
            `Comprobación de propiedad de un Game Pass.`
          )

          .addFields(
            {
              name: 'Usuario',
              value:
                `**${currentUsername}**`,
              inline: true
            },

            {
              name: 'Game Pass',
              value:
                `**${gamePassName}**`,
              inline: true
            },

            {
              name: 'Estado',
              value:
                `**${status}**`,
              inline: false
            },

            {
              name: 'User ID',
              value:
                `\`${userId}\``,
              inline: true
            },

            {
              name: 'Game Pass ID',
              value:
                `\`${gamePassId}\``,
              inline: true
            }
          )

          .setURL(
            `https://www.roblox.com/game-pass/${gamePassId}`
          )

          .setFooter({
            text:
              'Roblox Game Pass'
          })

          .setTimestamp();

      /*
       * ======================================================
       * THUMBNAIL
       * ======================================================
       *
       * La imagen es opcional.
       * Si Roblox no la devuelve, el embed sigue funcionando.
       */

      try {
        const thumbnailResponse =
          await fetch(
            `https://thumbnails.roblox.com/v1/game-passes?gamePassIds=${gamePassId}&size=150x150&format=Png&isCircular=false`,
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

        if (
          thumbnailResponse.ok
        ) {
          const thumbnailData =
            await thumbnailResponse.json();

          const imageUrl =
            thumbnailData
              ?.data?.[0]?.imageUrl;

          if (imageUrl) {
            embed.setThumbnail(
              imageUrl
            );
          }
        }
      } catch (thumbnailError) {
        console.log(
          '[gamepass] No se pudo obtener el thumbnail.'
        );
      }

      /*
       * ======================================================
       * ENVIAR
       * ======================================================
       */

      return interaction.editReply({
        embeds: [embed]
      });

    } catch (error) {
      console.error(
        'Error en /gamepass:',
        error
      );

      /*
       * ======================================================
       * RATE LIMIT
       * ======================================================
       */

      if (
        error.message ===
        'RATE_LIMIT'
      ) {
        return interaction.editReply({
          content:
            'Roblox está limitando temporalmente las consultas. Espera unos segundos e inténtalo nuevamente.'
        });
      }

      /*
       * ======================================================
       * ERROR DE OWNERSHIP
       * ======================================================
       */

      if (
        error.message.startsWith(
          'OWNERSHIP_'
        )
      ) {
        return interaction.editReply({
          content:
            'Roblox no permitió comprobar la propiedad de este Game Pass en este momento.'
        });
      }

      /*
       * ======================================================
       * ERROR GENERAL
       * ======================================================
       */

      return interaction.editReply({
        content:
          'No fue posible comprobar el Game Pass. Inténtalo nuevamente.'
      });
    }
  }
};