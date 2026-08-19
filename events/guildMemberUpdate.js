const fs = require('fs');
const path = require('path');

const {
  PermissionsBitField
} = require('discord.js');


/*
 * ============================================================
 * CONFIGURACIÓN
 * ============================================================
 */

const BOOSTER_ROLE_ID =
  process.env.BOOSTER_ROLE_ID;

const DATA_DIRECTORY =
  path.join(__dirname, '..', 'data');

const DATA_FILE =
  path.join(
    DATA_DIRECTORY,
    'boosterRoles.json'
  );


/*
 * ============================================================
 * ASEGURAR ARCHIVO DE DATOS
 * ============================================================
 */

function ensureDataFile() {

  if (!fs.existsSync(DATA_DIRECTORY)) {

    fs.mkdirSync(
      DATA_DIRECTORY,
      {
        recursive: true
      }
    );

  }


  if (!fs.existsSync(DATA_FILE)) {

    fs.writeFileSync(
      DATA_FILE,
      '{}',
      'utf8'
    );

  }

}


/*
 * ============================================================
 * LEER DATOS
 * ============================================================
 */

function loadBoosterRoles() {

  ensureDataFile();

  try {

    const data =
      fs.readFileSync(
        DATA_FILE,
        'utf8'
      );

    return JSON.parse(data);

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
 * GUARDAR DATOS
 * ============================================================
 */

function saveBoosterRoles(data) {

  ensureDataFile();

  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(
      data,
      null,
      2
    ),
    'utf8'
  );

}


/*
 * ============================================================
 * REGISTRAR EVENTO
 * ============================================================
 */

module.exports =
  function registerGuildMemberUpdate(client) {

    client.on(
      'guildMemberUpdate',
      async (oldMember, newMember) => {

        try {

          /*
           * --------------------------------------------------
           * CONFIGURACIÓN
           * --------------------------------------------------
           */

          if (!BOOSTER_ROLE_ID) {

            console.error(
              '❌ Falta BOOSTER_ROLE_ID en .env'
            );

            return;

          }


          /*
           * --------------------------------------------------
           * COMPROBAR CAMBIO DE BOOST
           * --------------------------------------------------
           */

          const wasBoosting =
            Boolean(
              oldMember.premiumSince
            );

          const isBoosting =
            Boolean(
              newMember.premiumSince
            );


          /*
           * --------------------------------------------------
           * EMPEZÓ A BOOSTEAR
           * --------------------------------------------------
           */

          if (
            !wasBoosting &&
            isBoosting
          ) {

            await createBoosterRole(
              newMember
            );

            return;

          }


          /*
           * --------------------------------------------------
           * DEJÓ DE BOOSTEAR
           * --------------------------------------------------
           */

          if (
            wasBoosting &&
            !isBoosting
          ) {

            await deleteBoosterRole(
              newMember
            );

            return;

          }

        } catch (error) {

          console.error(
            '❌ Error en guildMemberUpdate:',
            error
          );

        }

      }
    );

  };


/*
 * ============================================================
 * CREAR ROL DE BOOSTER
 * ============================================================
 */

async function createBoosterRole(member) {

  const guild =
    member.guild;


  /*
   * ----------------------------------------------------------
   * CARGAR REGISTRO
   * ----------------------------------------------------------
   */

  const boosterRoles =
    loadBoosterRoles();


  /*
   * ----------------------------------------------------------
   * BUSCAR ROL BOOSTER
   * ----------------------------------------------------------
   */

  const boosterRole =
    guild.roles.cache.get(
      BOOSTER_ROLE_ID
    );


  if (!boosterRole) {

    console.error(
      `❌ No encontré el rol Booster: ${BOOSTER_ROLE_ID}`
    );

    return;

  }


  /*
   * ----------------------------------------------------------
   * COMPROBAR BOT
   * ----------------------------------------------------------
   */

  const botMember =
    guild.members.me;


  if (!botMember) {

    console.error(
      '❌ No pude encontrar al bot dentro del servidor.'
    );

    return;

  }


  /*
   * ----------------------------------------------------------
   * COMPROBAR PERMISOS
   * ----------------------------------------------------------
   */

  if (
    !botMember.permissions.has(
      PermissionsBitField.Flags.ManageRoles
    )
  ) {

    console.error(
      `❌ El bot no tiene Manage Roles en ${guild.name}`
    );

    return;

  }


  /*
   * ----------------------------------------------------------
   * COMPROBAR JERARQUÍA
   * ----------------------------------------------------------
   */

  if (
    boosterRole.position >=
    botMember.roles.highest.position
  ) {

    console.error(
      `❌ El rol Booster está por encima del bot en ${guild.name}.`
    );

    return;

  }


  /*
   * ----------------------------------------------------------
   * ¿YA EXISTE UN REGISTRO?
   * ----------------------------------------------------------
   */

  const existingRoleId =
    boosterRoles[member.id];


  if (existingRoleId) {

    const existingRole =
      guild.roles.cache.get(
        existingRoleId
      );


    /*
     * Si todavía existe, simplemente
     * aseguramos que el usuario lo tenga.
     */

    if (existingRole) {

      if (
        !member.roles.cache.has(
          existingRole.id
        )
      ) {

        await member.roles.add(
          existingRole,
          'Restauración del rol personal de booster'
        );

      }

      return;

    }


    /*
     * El rol estaba registrado pero
     * fue eliminado manualmente.
     */

    delete boosterRoles[member.id];

    saveBoosterRoles(
      boosterRoles
    );

  }


  /*
   * ----------------------------------------------------------
   * CREAR ROL
   * ----------------------------------------------------------
   */

  const personalRole =
    await guild.roles.create({

      name:
        `Booster • ${member.user.username}`,

      color:
        '#2B2D31',

      hoist:
        false,

      mentionable:
        false,

      permissions:
        [],

      reason:
        `Rol personal creado por boost de ${member.user.tag}`

    });


  /*
   * ----------------------------------------------------------
   * COLOCAR DEBAJO DE BOOSTER
   * ----------------------------------------------------------
   */

  await personalRole.setPosition(
    Math.max(
      boosterRole.position - 1,
      1
    ),
    {
      reason:
        'Colocar rol personal debajo de Booster'
    }
  );


  /*
   * ----------------------------------------------------------
   * GUARDAR RELACIÓN USER ID → ROLE ID
   * ----------------------------------------------------------
   */

  boosterRoles[member.id] =
    personalRole.id;

  saveBoosterRoles(
    boosterRoles
  );


  /*
   * ----------------------------------------------------------
   * ASIGNAR AL USUARIO
   * ----------------------------------------------------------
   */

  await member.roles.add(
    personalRole,
    'Asignación de rol personal de booster'
  );


  /*
   * ----------------------------------------------------------
   * LOG
   * ----------------------------------------------------------
   */

  console.log(
    `✅ Rol personal creado para ${member.user.tag}`
  );

  console.log(
    `   Usuario: ${member.id}`
  );

  console.log(
    `   Rol: ${personalRole.id}`
  );

}


/*
 * ============================================================
 * ELIMINAR ROL DE BOOSTER
 * ============================================================
 */

async function deleteBoosterRole(member) {

  const guild =
    member.guild;


  /*
   * ----------------------------------------------------------
   * CARGAR REGISTRO
   * ----------------------------------------------------------
   */

  const boosterRoles =
    loadBoosterRoles();


  /*
   * ----------------------------------------------------------
   * BUSCAR ROL POR ID DEL USUARIO
   * ----------------------------------------------------------
   */

  const roleId =
    boosterRoles[member.id];


  /*
   * No hay registro
   */

  if (!roleId) {

    console.log(
      `ℹ️ ${member.user.tag} dejó de boostear, pero no tenía un rol registrado.`
    );

    return;

  }


  /*
   * ----------------------------------------------------------
   * BUSCAR ROL
   * ----------------------------------------------------------
   */

  const personalRole =
    guild.roles.cache.get(
      roleId
    );


  /*
   * ----------------------------------------------------------
   * ELIMINAR DEL REGISTRO
   * ----------------------------------------------------------
   */

  delete boosterRoles[member.id];

  saveBoosterRoles(
    boosterRoles
  );


  /*
   * ----------------------------------------------------------
   * SI YA NO EXISTE
   * ----------------------------------------------------------
   */

  if (!personalRole) {

    console.log(
      `ℹ️ El rol ${roleId} ya no existe.`
    );

    return;

  }


  /*
   * ----------------------------------------------------------
   * COMPROBAR QUE SEA EDITABLE
   * ----------------------------------------------------------
   */

  if (
    !personalRole.editable
  ) {

    console.error(
      `❌ No puedo eliminar el rol ${personalRole.id}. El bot no puede administrarlo.`
    );

    return;

  }


  /*
   * ----------------------------------------------------------
   * ELIMINAR
   * ----------------------------------------------------------
   */

  await personalRole.delete(
    `Eliminado porque ${member.user.tag} dejó de boostear`
  );


  /*
   * ----------------------------------------------------------
   * LOG
   * ----------------------------------------------------------
   */

  console.log(
    `🗑️ Rol personal eliminado de ${member.user.tag}`
  );

}