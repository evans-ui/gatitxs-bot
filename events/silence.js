const {
  EmbedBuilder
} = require('discord.js');

/*
 * ============================================================
 * CONFIGURACIÓN
 * ============================================================
 */

// Cuando encuentres el GIF que quieres utilizar,
// pega aquí su URL:
//
// const SILENCE_GIF = 'https://ejemplo.com/mi-gif.gif';

const SILENCE_GIF = '';


// Duración del silencio: 1 minuto
const SILENCE_DURATION = 60 * 1000;


/*
 * ============================================================
 * COMANDO
 * ============================================================
 */

module.exports = {
  name: 'silence',

  async execute(message, args) {

    /*
     * ========================================================
     * COMPROBAR SERVIDOR
     * ========================================================
     */

    if (!message.guild) {
      return;
    }


    /*
     * ========================================================
     * COMPROBAR BOOSTER
     * ========================================================
     *
     * premiumSince existe cuando el miembro está haciendo
     * boost actualmente al servidor.
     */

    if (!message.member.premiumSince) {
      return message.reply({
        content:
          'Este comando está disponible únicamente para los boosters del servidor.'
      });
    }


    /*
     * ========================================================
     * BUSCAR USUARIO MENCIONADO
     * ========================================================
     */

    const target =
      message.mentions.members.first();

    if (!target) {
      return message.reply({
        content:
          'Debes mencionar al usuario que quieres silenciar.\n\n' +
          'Ejemplo: `g.silence @usuario`'
      });
    }


    /*
     * ========================================================
     * NO PUEDE SILENCIARSE A SÍ MISMO
     * ========================================================
     */

    if (
      target.id === message.author.id
    ) {
      return message.reply({
        content:
          'No puedes utilizar este comando sobre ti mismo.'
      });
    }


    /*
     * ========================================================
     * NO SE PUEDE SILENCIAR AL OWNER
     * ========================================================
     */

    if (
      target.id === message.guild.ownerId
    ) {
      return message.reply({
        content:
          'No puedes silenciar al propietario del servidor.'
      });
    }


    /*
     * ========================================================
     * COMPROBAR SI YA TIENE TIMEOUT
     * ========================================================
     */

    if (
      target.communicationDisabledUntilTimestamp &&
      target.communicationDisabledUntilTimestamp > Date.now()
    ) {
      return message.reply({
        content:
          'Ese usuario ya tiene un silencio activo.'
      });
    }


    /*
     * ========================================================
     * COMPROBAR SI EL BOT PUEDE MODERAR AL USUARIO
     * ========================================================
     */

    if (!target.moderatable) {
      return message.reply({
        content:
          'No puedo silenciar a ese usuario. Su rol está por encima de mi rol o no tengo los permisos necesarios.'
      });
    }


    /*
     * ========================================================
     * APLICAR TIMEOUT
     * ========================================================
     */

    try {

      await target.timeout(
        SILENCE_DURATION,
        `Silenciado mediante g.silence por ${message.author.tag}`
      );

    } catch (error) {

      console.error(
        'Error aplicando timeout:',
        error
      );

      return message.reply({
        content:
          'No pude aplicar el silencio. Comprueba que tengo el permiso `Moderate Members`.'
      });
    }


    /*
     * ========================================================
     * CREAR EMBED
     * ========================================================
     */

    const embed =
      new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('Silence')
        .setDescription(
          `${target} ha sido silenciado durante **1 minuto**.`
        )
        .addFields(
          {
            name: 'Usuario',
            value: `${target.user.tag}`,
            inline: true
          },
          {
            name: 'Duración',
            value: '1 minuto',
            inline: true
          },
          {
            name: 'Aplicado por',
            value: `${message.author}`,
            inline: true
          }
        )
        .setFooter({
          text: 'Privilegio de booster'
        })
        .setTimestamp();


    /*
     * ========================================================
     * ENVIAR RESPUESTA
     * ========================================================
     */

    const response = {
      embeds: [embed]
    };


    /*
     * Si posteriormente colocas un GIF,
     * se añadirá automáticamente.
     */

    if (SILENCE_GIF.trim() !== '') {
      response.content = SILENCE_GIF;
    }


    return message.channel.send(response);
  }
};