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
 * ARCHIVO DE DATOS
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


function loadBoosterRoles() {

  ensureDataFile();

  try {

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

          if (!BOOSTER_ROLE_ID) {

            console.error(
              '❌ Falta BOOSTER_ROLE_ID en .env'
            );

            return;

          }


          const wasBoosting =
            Boolean(
              oldMember.premiumSince
            );

          const isBoosting =
            Boolean(
              newMember.premiumSince
            );


          /*
           * ==================================================
           * NUEVO BOOST
           * ==================================================
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
           * ==================================================
           * DEJÓ DE BOOSTEAR
           * ==================================================
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
 * COMPROBAR CONFIGURACIÓN DEL BOT
 * ============================================================
 */

function canManageBoosterRole(
  guild,
  boosterRole
) {

  const botMember =
    guild.members.me;


  if (!botMember) {

    console.error(
      '❌ No pude encontrar al bot en el servidor.'
    );

    return false;

  }


  if (
    !botMember.permissions.has(
      PermissionsBitField.Flags.ManageRoles
    )
  ) {

    console.error(
      `❌ El bot no tiene Manage Roles en ${guild.name}.`
    );

    return false;

  }


  if (
    boosterRole.position >=
    botMember.roles.highest.position
  ) {

    console.error(
      `❌ El rol Booster está por encima del bot en ${guild.name}.`
    );

    return false;

  }


  return true;

}


/*
 * ============================================================
 * CREAR ROL PERSONAL
 * ============================================================
 */

async function createBoosterRole(member) {

  const guild =
    member.guild;


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

    return null;

  }


  /*
   * ----------------------------------------------------------
   * COMPROBAR PERMISOS
   * ----------------------------------------------------------
   */

  if (
    !canManageBoosterRole(
      guild,
      boosterRole
    )
  ) {

    return null;

  }


  /*
   * ----------------------------------------------------------
   * SI YA EXISTE REGISTRO
   * ----------------------------------------------------------
   */

  const registeredRoleId =
    boosterRoles[member.id];


  if (registeredRoleId) {

    const registeredRole =
      guild.roles.cache.get(
        registeredRoleId
      );


    if (registeredRole) {

      /*
       * El rol existe.
       * Nos aseguramos de que el usuario lo tenga.
       */

      if (
        !member.roles.cache.has(
          registeredRole.id
        )
      ) {

        await member.roles.add(
          registeredRole,
          'Restauración de rol personal de booster'
        );

      }


      return registeredRole;

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

  const targetPosition =
    Math.max(
      boosterRole.position - 1,
      1
    );


  await personalRole.setPosition(
    targetPosition,
    {
      reason:
        'Colocar rol personal debajo de Booster'
    }
  );


  /*
   * ----------------------------------------------------------
   * GUARDAR USER ID → ROLE ID
   * ----------------------------------------------------------
   */

  boosterRoles[member.id] =
    personalRole.id;

  saveBoosterRoles(
    boosterRoles
  );


  /*
   * ----------------------------------------------------------
   * ASIGNAR
   * ----------------------------------------------------------
   */

  await member.roles.add(
    personalRole,
    'Asignación de rol personal de booster'
  );


  console.log(
    `✅ Rol personal creado para ${member.user.tag}`
  );

  console.log(
    `   Usuario: ${member.id}`
  );

  console.log(
    `   Rol: ${personalRole.id}`
  );


  return personalRole;

}


/*
 * ============================================================
 * ELIMINAR ROL PERSONAL
 * ============================================================
 */

async function deleteBoosterRole(member) {

  const guild =
    member.guild;


  const boosterRoles =
    loadBoosterRoles();


  const roleId =
    boosterRoles[member.id];


  if (!roleId) {

    console.log(
      `ℹ️ ${member.user.tag} dejó de boostear, pero no tiene un rol registrado.`
    );

    return;

  }


  /*
   * Primero eliminamos el registro.
   */

  delete boosterRoles[member.id];

  saveBoosterRoles(
    boosterRoles
  );


  /*
   * Buscar rol.
   */

  const personalRole =
    guild.roles.cache.get(
      roleId
    );


  if (!personalRole) {

    console.log(
      `ℹ️ El rol ${roleId} ya no existe.`
    );

    return;

  }


  /*
   * Comprobar que el bot pueda eliminarlo.
   */

  if (
    !personalRole.editable
  ) {

    console.error(
      `❌ No puedo eliminar el rol ${personalRole.id}.`
    );

    return;

  }


  /*
   * Eliminar.
   */

  await personalRole.delete(
    `Eliminado porque ${member.user.tag} dejó de boostear`
  );


  console.log(
    `🗑️ Rol personal eliminado de ${member.user.tag}`
  );

}


/*
 * ============================================================
 * SINCRONIZAR BOOSTERS EXISTENTES
 * ============================================================
 */

async function syncExistingBoosters(guild) {

  console.log(
    `🔄 Sincronizando boosters en ${guild.name}...`
  );


  /*
   * ----------------------------------------------------------
   * OBTENER TODOS LOS MIEMBROS
   * ----------------------------------------------------------
   */

  try {

    await guild.members.fetch();

  } catch (error) {

    console.error(
      `❌ No pude obtener los miembros de ${guild.name}:`,
      error
    );

    return;

  }


  /*
   * ----------------------------------------------------------
   * BUSCAR BOOSTERS
   * ----------------------------------------------------------
   */

  const boosters =
    guild.members.cache.filter(
      member =>
        Boolean(
          member.premiumSince
        )
    );


  console.log(
    `🔎 Encontrados ${boosters.size} boosters en ${guild.name}.`
  );


  /*
   * ----------------------------------------------------------
   * CREAR ROLES FALTANTES
   * ----------------------------------------------------------
   */

  let created = 0;

  let alreadyHad = 0;

  let failed = 0;


  for (
    const member of boosters.values()
  ) {

    try {

      const before =
        loadBoosterRoles();

      const hadRole =
        Boolean(
          before[member.id]
        );


      const role =
        await createBoosterRole(
          member
        );


      if (!role) {

        failed++;

        continue;

      }


      if (hadRole) {

        alreadyHad++;

      } else {

        created++;

      }


    } catch (error) {

      failed++;

      console.error(
        `❌ Error sincronizando a ${member.user.tag}:`,
        error
      );

    }

  }


  console.log(
    `✅ Sincronización terminada en ${guild.name}.`
  );

  console.log(
    `   Nuevos roles: ${created}`
  );

  console.log(
    `   Ya existentes: ${alreadyHad}`
  );

  console.log(
    `   Errores: ${failed}`
  );

}


/*
 * ============================================================
 * EXPORTAR SINCRONIZADOR
 * ============================================================
 */

module.exports.syncExistingBoosters =
  syncExistingBoosters;