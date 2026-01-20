require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const { PermissionsBitField } = require('discord.js');
const commands = [
    new SlashCommandBuilder()
    .setName('gamepasses')
    .setDescription('Muestra los gamepasses comprados visibles en el inventario de un usuario de Roblox')
    .addStringOption(option =>
      option.setName('usuario')
        .setDescription('Nombre de usuario de Roblox')
        .setRequired(true)
    ),
    
  new SlashCommandBuilder()
    .setName('perfil')
    .setDescription('Muestra la información del perfil de un usuario de Roblox')
    .addStringOption(option =>
      option.setName('usuario')
        .setDescription('Nombre de usuario de Roblox')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
   .setName('assets')
   .setDescription('Muestra los assets públicos creados por un usuario de Roblox')
   .addStringOption(option =>
     option.setName('usuario')
      .setDescription('Nombre de usuario de Roblox')
      .setRequired(true)
  ),
  new SlashCommandBuilder()
   .setName('avatar')
   .setDescription('Muestra el avatar de un usuario de Discord')
   .addUserOption(option =>
option.setName('usuario')
.setDescription('El usuario del que quieres ver el avatar')
.setRequired(false)
),
  new SlashCommandBuilder()
  .setName('say')
  .setDescription('El bot repite el mensaje que le indiques')
  .addStringOption(option =>
    option.setName('mensaje')
      .setDescription('El mensaje que dirá el bot')
      .setRequired(true)
  ),
  new SlashCommandBuilder()
  .setName('amigos')
  .setDescription('Muestra los amigos públicos de un usuario de Roblox')
  .addStringOption(option =>
    option.setName('usuario')
      .setDescription('Nombre de usuario de Roblox')
      .setRequired(true)
  ),
  new SlashCommandBuilder()
  .setName('juegos')
  .setDescription('Muestra los juegos públicos creados por un usuario de Roblox')
  .addStringOption(option =>
    option.setName('usuario')
      .setDescription('Nombre de usuario de Roblox')
      .setRequired(true)
  ),
  new SlashCommandBuilder()
  .setName('avatar2d')
  .setDescription('Muestra el avatar 2D de un usuario de Roblox')
  .addStringOption(option =>
    option.setName('usuario')
      .setDescription('Nombre de usuario de Roblox')
      .setRequired(true)
  ),
  new SlashCommandBuilder()
  .setName('grupos')
  .setDescription('Muestra los grupos de Roblox en los que está un usuario')
  .addStringOption(option =>
    option.setName('usuario')
      .setDescription('Nombre de usuario de Roblox')
      .setRequired(true)
  ),
   new SlashCommandBuilder()
    .setName('usuario')
    .setDescription('Verifica si un nombre de usuario de Roblox está en uso')
    .addStringOption(option =>
      option.setName('nombre')
        .setDescription('Nombre de usuario de Roblox')
        .setRequired(true)
    ),
    new SlashCommandBuilder()
  .setName('current')
  .setDescription('Muestra qué juego está jugando actualmente un usuario de Roblox (si está en línea)')
  .addStringOption(option =>
    option.setName('usuario')
      .setDescription('Nombre de usuario de Roblox')
      .setRequired(true)
  ),
  new SlashCommandBuilder()
  .setName('poll')
  .setDescription('Crea una encuesta con reacciones 👍 y 👎')
  .addStringOption(option =>
    option.setName('pregunta')
      .setDescription('Escribe la pregunta de la encuesta')
      .setRequired(true)
  ),
  new SlashCommandBuilder()
  .setName('seticono')
  .setDescription('Establece un emoji como ícono de un rol')
  .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles)
  .addRoleOption(option =>
    option.setName('rol')
      .setDescription('El rol al que se le pondrá el ícono')
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName('emoji')
      .setDescription('El emoji que se usará como ícono del rol')
      .setRequired(true)
  ),
  new SlashCommandBuilder()
  .setName('setcolor')
  .setDescription('Cambia el color de un rol')
  .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles)
  .addRoleOption(option =>
    option.setName('rol')
      .setDescription('El rol al que quieres cambiar el color')
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName('color')
      .setDescription('Color hexadecimal (por ejemplo, #ff0000)')
      .setRequired(true)
  ),
  new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Muestra información de un usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario del que quieres ver la info')
        .setRequired(false)
    ),
  new SlashCommandBuilder()
        .setName('track')
        .setDescription('Muestra si un jugador está online y en qué experiencia está jugando')
        .addStringOption(option =>
          option.setName('usuario')
            .setDescription('Nombre de usuario de Roblox')
            .setRequired(true)
        
  ),
  new SlashCommandBuilder()
    .setName('setgradient')
    .setDescription('Aplica un degradado de dos colores al ícono de un rol')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles)
    .addRoleOption(option =>
      option.setName('rol')
        .setDescription('El rol al que aplicarás el degradado')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('color1')
        .setDescription('Primer color hexadecimal (ej: #ff0000)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('color2')
        .setDescription('Segundo color hexadecimal (ej: #0000ff)')
        .setRequired(true)
    ),
    new SlashCommandBuilder()
    .setName('bansearch')
    .setDescription('Verifica si un usuario de Roblox ha sido baneado')
    .addStringOption(option =>
      option.setName('usuario')
        .setDescription('Nombre de usuario de Roblox')
        .setRequired(true)
    ),
    new SlashCommandBuilder()
    .setName('gameservers')
    .setDescription('Muestra los servidores activos de un juego de Roblox')
    .addStringOption(option =>
      option.setName('game_id')
        .setDescription('Place ID o Universe ID del juego')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('limite')
        .setDescription('Cantidad de servidores a mostrar (1-50)')
        .setRequired(false)
    ),
    new SlashCommandBuilder()
    .setName('namehistory')
    .setDescription('Muestra el historial completo de nombres de un usuario de Roblox')
    .addStringOption(option =>
      option.setName('usuario')
        .setDescription('Nombre de usuario de Roblox')
        .setRequired(true)
    ),
    new SlashCommandBuilder()
    .setName('friendactivity')
    .setDescription('Muestra qué están jugando los amigos de un usuario de Roblox')
    .addStringOption(option =>
      option.setName('usuario')
        .setDescription('Nombre de usuario de Roblox')
        .setRequired(true)
    ),






  
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('⏳ Registrando comandos...');

    await rest.put(
      process.env.GUILD_ID
        ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
        : Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log('✅ Comandos registrados correctamente.');
  } catch (error) {
    console.error('❌ Error registrando comandos:', error);
  }
})();

 

