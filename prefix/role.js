const fs = require('fs');
const path = require('path');

const {
  EmbedBuilder
} = require('discord.js');


/*
 * ============================================================
 * CONFIGURACIÓN
 * ============================================================
 */

const BOOSTER_ROLE_ID =
  process.env.BOOSTER_ROLE_ID;

const DATA_FILE =
  path.join(
    __dirname,
    '..',
    'data',
    'boosterRoles.json'
  );


/*
 * ============================================================
 * FUNCIONES DE DATOS
 * ============================================================
 */

function loadBoosterRoles() {

  try {

    if (!fs.existsSync(DATA_FILE)) {
      return {};
    }

    return JSON.parse(
      fs.readFileSync(
        DATA_FILE,
        'utf8'
      )
    );

  } catch (error) {

    console.error(
      '❌ Error leyendo boosterRoles.json:',
      error
    );

    return {};

  }

}


/*
 * ============================================================
 * VALIDAR HEX
 * ============================================================
 */

function isValidHex(color) {

  return /^#?[0-9A-Fa-f]{6}$/.test(
    color
  );

}


/*
 * ============================================================
 * NORMALIZAR HEX
 * ============================================================
 */

function normalizeHex(color) {

  if (
    !color.startsWith('#')
  ) {

    color =
      `#${color}`;

  }

  return color.toUpperCase();

}


/*
 * ============================================================
 * OBTENER ROL PERSONAL
 * ============================================================
 */

function getPersonalRole(member) {

  const boosterRoles =
    loadBoosterRoles();

  const roleId =
    boosterRoles[member.id];


  if (!roleId) {
    return null;
  }


  return member.guild.roles.cache.get(
    roleId
  ) || null;

}


/*
 * ============================================================
 * COMANDO
 * ============================================================
 */

module.exports = {

  name: 'role',

  async execute(message, args) {

    /*
     * --------------------------------------------------------
     * SERVIDOR
     * --------------------------------------------------------
     */

    if (!message.guild) {
      return;
    }


    /*
     * --------------------------------------------------------
     * BOOSTER
     * --------------------------------------------------------
     */

    if (
      !message.member.premiumSince
    ) {

      return message.reply({
        content:
          'Este sistema está disponible únicamente para los boosters del servidor.'
      });

    }


    /*
     * --------------------------------------------------------
     * BUSCAR ROL
     * --------------------------------------------------------
     */

    const personalRole =
      getPersonalRole(
        message.member
      );


    if (!personalRole) {

      return message.reply({
        content:
          'No encontré tu rol personal de booster. Si acabas de hacer boost, espera unos segundos e inténtalo nuevamente.'
      });

    }


    /*
     * --------------------------------------------------------
     * BUSCAR BOOSTER ROLE
     * --------------------------------------------------------
     */

    const boosterRole =
      message.guild.roles.cache.get(
        BOOSTER_ROLE_ID
      );


    if (!boosterRole) {

      return message.reply({
        content:
          'El sistema de boosters no está configurado correctamente.'
      });

    }


    /*
     * --------------------------------------------------------
     * SEGURIDAD: ROL DEBE ESTAR DEBAJO DE BOOSTER
     * --------------------------------------------------------
     */

    if (
      personalRole.position >=
      boosterRole.position
    ) {

      return message.reply({
        content:
          'Tu rol personal está colocado incorrectamente. Contacta con la administración.'
      });

    }


    /*
     * --------------------------------------------------------
     * SEGURIDAD: ROL EDITABLE
     * --------------------------------------------------------
     */

    if (
      !personalRole.editable
    ) {

      return message.reply({
        content:
          'No puedo editar tu rol personal porque mi rol no tiene suficiente jerarquía.'
      });

    }


    /*
     * --------------------------------------------------------
     * ACCIÓN
     * --------------------------------------------------------
     */

    const action =
      args
        .shift()
        ?.toLowerCase();


    /*
     * ========================================================
     * AYUDA
     * ========================================================
     */

    if (!action) {

      const embed =
        new EmbedBuilder()

          .setColor(
            0x5865F2
          )

          .setTitle(
            'Personal Role'
          )

          .setDescription(
            'Personaliza el rol que recibes por boostear el servidor.'
          )

          .addFields(

            {
              name:
                'Color',

              value:
                '`g.role color #FF69B4`',

              inline:
                false
            },

            {
              name:
                'Icono',

              value:
                '`g.role icon :emoji:`',

              inline:
                false
            },

            {
              name:
                'Gradiente',

              value:
                '`g.role gradient #FF69B4 #7289DA`',

              inline:
                false
            },

            {
              name:
                'Restablecer',

              value:
                '`g.role reset`',

              inline:
                false
            },

            {
              name:
                'Información',

              value:
                '`g.role info`',

              inline:
                false
            }

          )

          .setFooter({
            text:
              'Disponible exclusivamente para boosters'
          })

          .setTimestamp();


      return message.reply({
        embeds: [embed]
      });

    }


    /*
     * ========================================================
     * COLOR
     * ========================================================
     */

    if (
      action === 'color'
    ) {

      const color =
        args.shift();


      if (!color) {

        return message.reply({
          content:
            'Debes indicar un color hexadecimal.\n\nEjemplo: `g.role color #FF69B4`'
        });

      }


      if (
        !isValidHex(color)
      ) {

        return message.reply({
          content:
            'El color no es válido. Utiliza un formato como `#FF69B4`.'
        });

      }


      const normalized =
        normalizeHex(
          color
        );


      try {

        await personalRole.setColor(
          normalized,
          `Color personalizado por ${message.author.tag}`
        );


        const embed =
          new EmbedBuilder()

            .setColor(
              normalized
            )

            .setTitle(
              'Personal Role'
            )

            .setDescription(
              `El color de ${personalRole} ha sido actualizado correctamente.`
            )

            .addFields({

              name:
                'Nuevo color',

              value:
                `\`${normalized}\``,

              inline:
                true

            })

            .setFooter({
              text:
                `Configurado por ${message.author.tag}`
            })

            .setTimestamp();


        return message.reply({
          embeds: [embed]
        });


      } catch (error) {

        console.error(
          '❌ Error cambiando color:',
          error
        );

        return message.reply({
          content:
            'No pude cambiar el color de tu rol.'
        });

      }

    }


    /*
     * ========================================================
     * ICON
     * ========================================================
     */

    if (
      action === 'icon'
    ) {

      const emoji =
        args.join(' ').trim();


      if (!emoji) {

        return message.reply({
          content:
            'Debes indicar un emoji.\n\nEjemplo: `g.role icon :cat:`'
        });

      }


      try {

        /*
         * Emoji personalizado
         */

        const customEmoji =
          message.guild.emojis.cache.find(
            emojiObject => {

              return (
                `<:${emojiObject.name}:${emojiObject.id}>`
                === emoji
                ||
                `<a:${emojiObject.name}:${emojiObject.id}>`
                === emoji
              );

            }
          );


        if (customEmoji) {

          await personalRole.setIcon(
            customEmoji.url,
            `Icono personalizado por ${message.author.tag}`
          );

        } else {

          /*
           * Emoji Unicode
           */

          await personalRole.setUnicodeEmoji(
            emoji,
            `Icono personalizado por ${message.author.tag}`
          );

        }


        const embed =
          new EmbedBuilder()

            .setColor(
              personalRole.color ||
              0x5865F2
            )

            .setTitle(
              'Personal Role'
            )

            .setDescription(
              `El icono de ${personalRole} ha sido actualizado correctamente.`
            )

            .addFields({

              name:
                'Icono',

              value:
                emoji,

              inline:
                true

            })

            .setFooter({
              text:
                `Configurado por ${message.author.tag}`
            })

            .setTimestamp();


        return message.reply({
          embeds: [embed]
        });


      } catch (error) {

        console.error(
          '❌ Error cambiando icono:',
          error
        );

        return message.reply({
          content:
            'No pude establecer ese emoji como icono del rol.'
        });

      }

    }


    /*
     * ========================================================
     * GRADIENT
     * ========================================================
     */

    if (
      action === 'gradient'
    ) {

      const color1 =
        args.shift();

      const color2 =
        args.shift();


      if (
        !color1 ||
        !color2
      ) {

        return message.reply({
          content:
            'Debes indicar dos colores.\n\nEjemplo: `g.role gradient #FF69B4 #7289DA`'
        });

      }


      if (
        !isValidHex(color1) ||
        !isValidHex(color2)
      ) {

        return message.reply({
          content:
            'Uno de los colores no es válido. Utiliza colores como `#FF69B4`.'
        });

      }


      const normalized1 =
        normalizeHex(
          color1
        );

      const normalized2 =
        normalizeHex(
          color2
        );


      try {

        await personalRole.setColors({

          primaryColor:
            normalized1,

          secondaryColor:
            normalized2

        });


        const embed =
          new EmbedBuilder()

            .setColor(
              normalized1
            )

            .setTitle(
              'Personal Role'
            )

            .setDescription(
              `El gradiente de ${personalRole} ha sido actualizado correctamente.`
            )

            .addFields(

              {
                name:
                  'Color 1',

                value:
                  `\`${normalized1}\``,

                inline:
                  true
              },

              {
                name:
                  'Color 2',

                value:
                  `\`${normalized2}\``,

                inline:
                  true
              }

            )

            .setFooter({
              text:
                `Configurado por ${message.author.tag}`
            })

            .setTimestamp();


        return message.reply({
          embeds: [embed]
        });


      } catch (error) {

        console.error(
          '❌ Error aplicando gradiente:',
          error
        );

        return message.reply({
          content:
            'No pude aplicar el gradiente. Comprueba que el servidor soporte los estilos de color de roles y que discord.js esté actualizado.'
        });

      }

    }


    /*
     * ========================================================
     * RESET
     * ========================================================
     */

    if (
      action === 'reset'
    ) {

      try {

        /*
         * Volver al color normal
         */

        await personalRole.setColor(
          0,
          `Reset solicitado por ${message.author.tag}`
        );


        /*
         * Eliminar icono personalizado
         */

        await personalRole.setIcon(
          null,
          `Reset solicitado por ${message.author.tag}`
        );


        /*
         * Eliminar emoji Unicode
         */

        await personalRole.setUnicodeEmoji(
          null,
          `Reset solicitado por ${message.author.tag}`
        );


        /*
         * Intentar eliminar colores
         * secundarios si la versión
         * instalada lo permite.
         */

        if (
          typeof personalRole.setColors ===
          'function'
        ) {

          await personalRole.setColors({

            primaryColor:
              0,

            secondaryColor:
              null,

            tertiaryColor:
              null

          });

        }


        const embed =
          new EmbedBuilder()

            .setColor(
              0x2B2D31
            )

            .setTitle(
              'Personal Role'
            )

            .setDescription(
              `El rol ${personalRole} ha vuelto a su configuración predeterminada.`
            )

            .setFooter({
              text:
                `Restablecido por ${message.author.tag}`
            })

            .setTimestamp();


        return message.reply({
          embeds: [embed]
        });


      } catch (error) {

        console.error(
          '❌ Error haciendo reset:',
          error
        );

        return message.reply({
          content:
            'No pude restablecer completamente tu rol.'
        });

      }

    }


    /*
     * ========================================================
     * INFO
     * ========================================================
     */

    if (
      action === 'info'
    ) {

      const color =
        personalRole.hexColor;


      let icon =
        'Sin icono';


      if (
        personalRole.unicodeEmoji
      ) {

        icon =
          personalRole.unicodeEmoji;

      } else if (
        personalRole.icon
      ) {

        icon =
          'Icono personalizado';

      }


      const embed =
        new EmbedBuilder()

          .setColor(
            personalRole.color ||
            0x5865F2
          )

          .setTitle(
            'Personal Role'
          )

          .setDescription(
            `Configuración del rol personal de ${message.author}.`
          )

          .addFields(

            {
              name:
                'Rol',

              value:
                `${personalRole}`,

              inline:
                true
            },

            {
              name:
                'Color',

              value:
                `\`${color}\``,

              inline:
                true
            },

            {
              name:
                'Icono',

              value:
                icon,

              inline:
                true
            },

            {
              name:
                'Posición',

              value:
                'Debajo de Booster',

              inline:
                true
            }

          )

          .setFooter({
            text:
              'Personal Role'
          })

          .setTimestamp();


      return message.reply({
        embeds: [embed]
      });

    }


    /*
     * ========================================================
     * OPCIÓN DESCONOCIDA
     * ========================================================
     */

    return message.reply({
      content:
        'No reconozco esa opción.\n\nUsa `g.role` para ver las opciones disponibles.'
    });

  }

};