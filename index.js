const express = require('express');
const app = express();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

app.get('/', (req, res) => {
  res.send('Bot está activo');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const puppeteer = require('puppeteer');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.on('ready', () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // ========== COMANDO: /avatar ==========
  if (interaction.commandName === 'avatar') {
    try {
      const usuario = interaction.options.getUser('usuario') || interaction.user;
      const embed = {
        title: `Avatar de ${usuario.username}`,
        image: {
          url: usuario.displayAvatarURL({ dynamic: true, size: 512 })
        },
        color: 0x00b0f4,
        footer: {
          text: `ID: ${usuario.id}`
        }
      };
      
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error al mostrar avatar:', error);
      await interaction.reply('❌ Hubo un error al obtener el avatar.');
    }
  }
  
  // ========== COMANDO: /perfil ==========
  if (interaction.commandName === 'perfil') {
    const username = interaction.options.getString('usuario');
    await interaction.deferReply();

    try {
      const userRes = await axios.post('https://users.roblox.com/v1/usernames/users', {
        usernames: [username],
        excludeBannedUsers: false
      });
      
      if (!userRes.data?.data?.length) {
        return interaction.editReply('❌ No se encontró el usuario.');
      }
      
      const userId = userRes.data.data[0].id;

      const [profile, thumbnail] = await Promise.all([
        axios.get(`https://users.roblox.com/v1/users/${userId}`),
        axios.get(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=420x420&format=Png&isCircular=false`)
      ]);

      const info = profile.data;
      const avatarUrl = thumbnail.data.data[0]?.imageUrl;

      const embed = {
        title: info.displayName || info.name,
        url: `https://www.roblox.com/users/${userId}/profile`,
        color: 0x0099ff,
        thumbnail: {
          url: avatarUrl
        },
        fields: [
          { name: 'Username', value: info.name, inline: true },
          { name: 'User ID', value: userId.toString(), inline: true },
          { name: 'Fecha de creación', value: new Date(info.created).toLocaleDateString(), inline: false }
        ]
      };

      if (info.description) {
        embed.fields.push({ name: 'Descripción', value: info.description });
      }

      return interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error al obtener perfil:', error.message);
      return interaction.editReply('⚠️ Hubo un error al consultar el perfil.');
    }
  }
  
  // ========== COMANDO: /assets ==========
  if (interaction.commandName === 'assets') {
    const username = interaction.options.getString('usuario');
    await interaction.deferReply();
  
    try {
      const userRes = await axios.post('https://users.roblox.com/v1/usernames/users', {
        usernames: [username],
        excludeBannedUsers: false
      });
  
      if (!userRes.data?.data?.length) {
        return interaction.editReply('❌ No se encontró el usuario.');
      }
  
      const userId = userRes.data.data[0].id;
  
      const assetsRes = await axios.get(`https://catalog.roblox.com/v1/search/items`, {
        params: {
          CreatorTargetId: userId,
          CreatorType: 'User',
          Limit: 10,
          SortType: 3
        }
      });
  
      const assets = assetsRes.data.data;
      if (!assets.length) {
        return interaction.editReply(`ℹ️ El usuario **${username}** no tiene assets públicos.`);
      }
  
      const embed = {
        title: `Assets públicos de ${username}`,
        color: 0x00b0f4,
        fields: assets
          .filter(asset => asset.name && asset.id)
          .map(asset => ({
            name: asset.name || 'Sin nombre',
            value: `[Ver en Roblox](https://www.roblox.com/catalog/${asset.id})`,
            inline: true
          })),
        footer: {
          text: `Mostrando ${assets.length} assets`
        }
      };
  
      return interaction.editReply({ embeds: [embed] });
  
    } catch (err) {
      console.error('Error al obtener assets:', err.message);
      return interaction.editReply('⚠️ Ocurrió un error al obtener los assets del usuario.');
    }
  }

  // ========== COMANDO: /say ==========
  if (interaction.commandName === 'say') {
    const mensaje = interaction.options.getString('mensaje');
  
    try {
      await interaction.deferReply({ ephemeral: true });
      await interaction.deleteReply();
      await interaction.channel.send(mensaje);
    } catch (error) {
      console.error('Error en /say:', error.message);
      try {
        await interaction.reply({ content: '❌ Hubo un error al enviar el mensaje.', ephemeral: true });
      } catch {}
    }
  }

  // ========== COMANDO: /amigos ==========
  if (interaction.commandName === 'amigos') {
    const username = interaction.options.getString('usuario');
    await interaction.deferReply();
  
    try {
      const userRes = await axios.post('https://users.roblox.com/v1/usernames/users', {
        usernames: [username],
        excludeBannedUsers: false
      });
  
      if (!userRes.data?.data?.length) {
        return interaction.editReply(`❌ No se encontró el usuario **${username}**.`);
      }
  
      const userId = userRes.data.data[0].id;
      const friendsRes = await axios.get(`https://friends.roblox.com/v1/users/${userId}/friends`);
      const friends = friendsRes.data.data;
  
      if (!friends.length) {
        return interaction.editReply(`ℹ️ El usuario **${username}** no tiene amigos públicos.`);
      }
  
      const generateEmbed = (page) => {
        const perPage = 10;
        const start = page * perPage;
        const end = start + perPage;
        const pageFriends = friends.slice(start, end);
  
        return {
          title: `👥 Amigos públicos de ${username}`,
          description: pageFriends.map(f =>
            `[${f.displayName || f.name}](https://www.roblox.com/users/${f.id}/profile)`
          ).join('\n'),
          color: 0x00b0f4,
          footer: {
            text: `Página ${page + 1} de ${Math.ceil(friends.length / perPage)}`
          }
        };
      };
  
      let currentPage = 0;
      const row = {
        type: 1,
        components: [
          {
            type: 2,
            label: '⬅️ Anterior',
            style: 1,
            custom_id: 'prev',
            disabled: true
          },
          {
            type: 2,
            label: '➡️ Siguiente',
            style: 1,
            custom_id: 'next',
            disabled: friends.length <= 10
          }
        ]
      };
  
      const reply = await interaction.editReply({
        embeds: [generateEmbed(currentPage)],
        components: [row]
      });
  
      const collector = reply.createMessageComponentCollector({
        time: 60000,
        filter: i => i.user.id === interaction.user.id
      });
  
      collector.on('collect', async i => {
        if (i.customId === 'next') currentPage++;
        else if (i.customId === 'prev') currentPage--;
  
        row.components[0].disabled = currentPage === 0;
        row.components[1].disabled = currentPage >= Math.ceil(friends.length / 10) - 1;
  
        await i.update({
          embeds: [generateEmbed(currentPage)],
          components: [row]
        });
      });
  
      collector.on('end', async () => {
        row.components.forEach(btn => btn.disabled = true);
        await interaction.editReply({ components: [row] });
      });
  
    } catch (err) {
      console.error('Error en /amigos:', err.message);
      return interaction.editReply('⚠️ Hubo un error al obtener los amigos.');
    }
  }
   
  // ========== COMANDO: /juegos ==========
  if (interaction.commandName === 'juegos') {
    const username = interaction.options.getString('usuario');
    await interaction.deferReply();
  
    try {
      const userRes = await axios.post('https://users.roblox.com/v1/usernames/users', {
        usernames: [username],
        excludeBannedUsers: false
      });
  
      if (!userRes.data?.data?.length) {
        return interaction.editReply('❌ No se encontró el usuario.');
      }
  
      const userId = userRes.data.data[0].id;
  
      const gamesRes = await axios.get(`https://games.roblox.com/v2/users/${userId}/games`, {
        params: {
          sortOrder: 'Asc',
          limit: 10
        }
      });
  
      const games = gamesRes.data.data;
  
      if (!games.length) {
        return interaction.editReply(`ℹ️ El usuario **${username}** no tiene juegos públicos.`);
      }
  
      const embed = {
        title: `🎮 Juegos de ${username}`,
        color: 0x57F287,
        fields: games.map(game => ({
          name: game.name || 'Sin nombre',
          value: `[Ir al juego](https://www.roblox.com/games/${game.id})\n👥 ${game.playing} jugando ahora`,
          inline: false
        })),
        footer: {
          text: `Mostrando ${games.length} juegos`
        }
      };
  
      return interaction.editReply({ embeds: [embed] });
  
    } catch (error) {
      console.error('Error al obtener juegos:', error.message);
      return interaction.editReply('⚠️ Hubo un error al consultar los juegos del usuario.');
    }
  }

  // ========== COMANDO: /avatar2d ==========
  if (interaction.commandName === 'avatar2d') {
    const username = interaction.options.getString('usuario');
    await interaction.deferReply();
  
    try {
      const userRes = await axios.post('https://users.roblox.com/v1/usernames/users', {
        usernames: [username],
        excludeBannedUsers: false,
      });
  
      if (!userRes.data.data.length) {
        return interaction.editReply(`❌ No se encontró el usuario **${username}**.`);
      }
  
      const userId = userRes.data.data[0].id;
  
      const thumbRes = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot`, {
        params: {
          userIds: userId,
          size: '720x720',
          format: 'Png',
          isCircular: false
        }
      });
  
      const avatar = thumbRes.data.data[0];
      if (!avatar || avatar.state !== 'Completed' || !avatar.imageUrl) {
        return interaction.editReply(`⚠️ Roblox no devolvió la imagen del avatar.`);
      }
  
      const embed = {
        title: `Avatar 2D de ${username}`,
        image: {
          url: avatar.imageUrl
        },
        color: 0x00b0f4,
        footer: {
          text: `User ID: ${userId}`
        }
      };
  
      return interaction.editReply({ embeds: [embed] });
  
    } catch (error) {
      console.error('Error al obtener avatar 2D:', error);
      return interaction.editReply(`⚠️ Ocurrió un error al obtener el avatar.`);
    }
  }

  // ========== COMANDO: /grupos ==========
  if (interaction.commandName === 'grupos') {
    const username = interaction.options.getString('usuario');
    await interaction.deferReply();
  
    try {
      const userRes = await axios.post('https://users.roblox.com/v1/usernames/users', {
        usernames: [username],
        excludeBannedUsers: false
      });
  
      if (!userRes.data?.data?.length) {
        return interaction.editReply(`❌ No se encontró el usuario **${username}**.`);
      }
  
      const userId = userRes.data.data[0].id;
  
      const groupRes = await axios.get(`https://groups.roblox.com/v2/users/${userId}/groups/roles`);
      const groups = groupRes.data.data;
  
      if (!groups.length) {
        return interaction.editReply(`ℹ️ El usuario **${username}** no pertenece a ningún grupo.`);
      }
  
      const embed = {
        title: `Grupos de ${username}`,
        description: groups
          .slice(0, 20)
          .map(g => `[${g.group.name}](https://www.roblox.com/groups/${g.group.id}) - ${g.role.name}`)
          .join('\n'),
        color: 0x1abc9c,
        footer: {
          text: `Mostrando ${Math.min(20, groups.length)} de ${groups.length} grupos`
        }
      };
  
      return interaction.editReply({ embeds: [embed] });
  
    } catch (err) {
      console.error('Error al obtener grupos:', err.message);
      return interaction.editReply('⚠️ Ocurrió un error al consultar los grupos del usuario.');
    }
  }

  // ========== COMANDO: /gamepasses ==========
  if (interaction.commandName === 'gamepasses') {
    const username = interaction.options.getString('usuario');
    await interaction.deferReply();
  
    try {
      const userId = await obtenerUserId(username);
      if (!userId) {
        return interaction.editReply(`❌ No se encontró el usuario **${username}**.`);
      }
  
      const gamepasses = await obtenerGamepassesScraping(userId);
      if (!gamepasses.length) {
        return interaction.editReply(`ℹ️ El usuario **${username}** no tiene gamepasses visibles o su inventario está privado.`);
      }
  
      let currentPage = 0;
      const perPage = 5;
  
      const generateEmbed = (page) => {
        const start = page * perPage;
        const end = start + perPage;
        const pageGamepasses = gamepasses.slice(start, end);
  
        return {
          title: `🎟️ Gamepasses de ${username}`,
          description: pageGamepasses
            .map(gp => `[${gp.name}](${gp.link})`)
            .join('\n'),
          color: 0x3498db,
          footer: {
            text: `Página ${page + 1} de ${Math.ceil(gamepasses.length / perPage)}`
          }
        };
      };
  
      const row = {
        type: 1,
        components: [
          {
            type: 2,
            label: '⬅️ Anterior',
            style: 1,
            custom_id: 'prev',
            disabled: true
          },
          {
            type: 2,
            label: '➡️ Siguiente',
            style: 1,
            custom_id: 'next',
            disabled: gamepasses.length <= perPage
          }
        ]
      };
  
      const reply = await interaction.editReply({
        embeds: [generateEmbed(currentPage)],
        components: [row]
      });
  
      const collector = reply.createMessageComponentCollector({
        time: 60000,
        filter: i => i.user.id === interaction.user.id
      });
  
      collector.on('collect', async i => {
        if (i.customId === 'next') currentPage++;
        else if (i.customId === 'prev') currentPage--;
  
        row.components[0].disabled = currentPage === 0;
        row.components[1].disabled = currentPage >= Math.ceil(gamepasses.length / perPage) - 1;
  
        await i.update({
          embeds: [generateEmbed(currentPage)],
          components: [row]
        });
      });
  
      collector.on('end', async () => {
        row.components.forEach(btn => btn.disabled = true);
        await interaction.editReply({ components: [row] });
      });
  
    } catch (err) {
      console.error('Error al obtener gamepasses:', err.message);
      return interaction.editReply(`⚠️ Ocurrió un error al obtener los gamepasses del usuario.`);
    }
  }

  // ========== COMANDO: /usuario ==========
  if (interaction.commandName === 'usuario') {
    const nombre = interaction.options.getString('nombre');
    await interaction.deferReply();

    try {
      const res = await axios.post('https://users.roblox.com/v1/usernames/users', {
        usernames: [nombre],
        excludeBannedUsers: false
      });

      const encontrado = res.data.data.length > 0;

      if (encontrado) {
        return interaction.editReply(`❌ El nombre **${nombre}** está en uso por el usuario con ID **${res.data.data[0].id}**.`);
      } else {
        return interaction.editReply(`✅ El nombre **${nombre}** está disponible.`);
      }

    } catch (err) {
      console.error('Error en /usuario:', err.message);
      return interaction.editReply('⚠️ Ocurrió un error al verificar el nombre de usuario.');
    }
  }

  // ========== COMANDO: /current ==========
  if (interaction.commandName === 'current') {
    const username = interaction.options.getString('usuario');
    await interaction.deferReply();

    try {
      const userRes = await axios.post('https://users.roblox.com/v1/usernames/users', {
        usernames: [username],
        excludeBannedUsers: false
      });

      if (!userRes.data?.data?.length) {
        return interaction.editReply(`❌ No se encontró el usuario **${username}**.`);
      }

      const userId = userRes.data.data[0].id;

      const presenceRes = await axios.post('https://presence.roblox.com/v1/presence/users', {
        userIds: [userId]
      });

      const presence = presenceRes.data.userPresences[0];

      if (presence.userPresenceType === 2) {
        if (presence.placeId && presence.universeId) {
          const gameDetailsRes = await axios.get(`https://games.roblox.com/v1/games?universeIds=${presence.universeId}`);
          const gameData = gameDetailsRes.data.data[0];

          const embed = {
            title: `${username} está jugando ahora`,
            description: `🎮 **${gameData.name || 'Juego desconocido'}**`,
            color: 0x00b0f4,
            fields: [
              {
                name: '🔗 Enlace al juego',
                value: `[Unirse al juego](https://www.roblox.com/games/${presence.placeId})`
              }
            ],
            footer: {
              text: `User ID: ${userId}`
            }
          };
          return interaction.editReply({ embeds: [embed] });
        } else {
          return interaction.editReply(`🎮 **${username}** está en un juego, pero no es posible ver cuál.\nEsto puede deberse a que:\n• El juego es privado\n• El usuario está en Roblox Studio\n• Tiene su actividad oculta.`);
        }
      } else if (presence.userPresenceType === 1) {
        return interaction.editReply(`🟢 **${username}** está en línea, pero no está en ningún juego actualmente.`);
      } else {
        return interaction.editReply(`🔴 **${username}** no está en línea en este momento.`);
      }
    } catch (error) {
      console.error('Error en /current:', error.message);
      return interaction.editReply(`⚠️ Hubo un error al obtener el estado del usuario.`);
    }
  }

  // ========== COMANDO: /poll (NUEVO) ==========
  if (interaction.commandName === 'poll') {
    const pregunta = interaction.options.getString('pregunta');

    try {
      const embed = {
        title: '📊 Encuesta',
        description: pregunta,
        color: 0xf1c40f,
        footer: {
          text: `Encuesta creada por ${interaction.user.tag}`,
          icon_url: interaction.user.displayAvatarURL({ dynamic: true })
        },
        timestamp: new Date()
      };

      await interaction.reply({ embeds: [embed] });
      
      const mensaje = await interaction.fetchReply();
      await mensaje.react('👍');
      await mensaje.react('👎');

    } catch (error) {
      console.error('Error en /poll:', error);
      await interaction.reply({ content: '❌ Hubo un error al crear la encuesta.', ephemeral: true });
    }
  }

  // ========== COMANDO: /seticono ==========
  if (interaction.commandName === 'seticono') {
    try {
      const rol = interaction.options.getRole('rol');
      const emojiInput = interaction.options.getString('emoji');

      if (!interaction.guild.members.me.permissions.has('ManageRoles')) {
        return await interaction.reply({
          content: '❌ No tengo permisos para editar roles.',
          ephemeral: true
        });
      }

      const botRole = interaction.guild.members.me.roles.highest;
      if (botRole.position <= rol.position) {
        return await interaction.reply({
          content: '❌ No puedo modificar este rol porque está por encima de mi rol más alto.',
          ephemeral: true
        });
      }

      const customEmojiRegex = /^<a?:\w+:(\d+)>$/;
      const match = emojiInput.match(customEmojiRegex);

      if (match) {
        const emojiId = match[1];
        const isAnimated = emojiInput.startsWith('<a:');
        const extension = isAnimated ? 'gif' : 'png';
        const emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${extension}`;

        const res = await fetch(emojiUrl);
        if (!res.ok) throw new Error('No se pudo descargar el emoji.');

        const iconBuffer = await res.buffer();
        await rol.setIcon(iconBuffer);
        await interaction.reply(`✅ Ícono del rol **${rol.name}** actualizado con emoji personalizado.`);
      } else {
        await rol.setIcon(emojiInput);
        await interaction.reply(`✅ Ícono del rol **${rol.name}** actualizado a ${emojiInput}`);
      }

    } catch (error) {
      console.error('Error en /seticono:', error);
      await interaction.reply({
        content: '❌ No se pudo establecer el ícono. Asegúrate de que el emoji sea válido y el servidor tenga **boost nivel 2 o superior**.',
        ephemeral: true
      });
    }
  }

  // ========== COMANDO: /setcolor ==========
  if (interaction.commandName === 'setcolor') {
    try {
      const rol = interaction.options.getRole('rol');
      const color = interaction.options.getString('color');

      if (!interaction.guild.members.me.permissions.has('ManageRoles')) {
        return await interaction.reply({
          content: '❌ No tengo permisos para editar roles.',
          ephemeral: true,
        });
      }

      const botRole = interaction.guild.members.me.roles.highest;
      if (botRole.position <= rol.position) {
        return await interaction.reply({
          content: '❌ No puedo modificar este rol porque está por encima de mi rol más alto.',
          ephemeral: true,
        });
      }

      const hexRegex = /^#?([a-fA-F0-9]{6})$/;
      const match = color.match(hexRegex);
      if (!match) {
        return await interaction.reply({
          content: '❌ El color debe estar en formato hexadecimal. Ejemplo: `#00ff00` o `00ff00`.',
          ephemeral: true,
        });
      }

      const hexColor = `#${match[1]}`;

      await rol.setColor(hexColor);
      await interaction.reply(`✅ Color del rol **${rol.name}** cambiado a \`${hexColor}\`.`);
    } catch (error) {
      console.error('Error en /setcolor:', error);
      await interaction.reply({
        content: '❌ Ocurrió un error al cambiar el color del rol.',
        ephemeral: true,
      });
    }
  }

  // ========== COMANDO: /userinfo ==========
  if (interaction.commandName === 'userinfo') {
    const user = interaction.options.getUser('usuario') || interaction.user;
    const member = interaction.guild.members.cache.get(user.id) || await interaction.guild.members.fetch(user.id).catch(() => null);
    const avatar = user.displayAvatarURL({ dynamic: true, size: 1024 });

    const userFlags = user.flags?.toArray() || [];
    const badgeEmojis = {
      ActiveDeveloper: '💻',
      BugHunterLevel1: '🐛',
      BugHunterLevel2: '🐞',
      CertifiedModerator: '🛡️',
      HypeSquadOnlineHouse1: '🏠',
      HypeSquadOnlineHouse2: '🏡',
      HypeSquadOnlineHouse3: '🏘️',
      HypeSquadEvents: '🎉',
      Partner: '🤝',
      PremiumEarlySupporter: '✨',
      Staff: '👑',
      VerifiedDeveloper: '🧪',
      System: '⚙️'
    };

    const badges = userFlags.map(flag => badgeEmojis[flag] || flag).join(' ') || 'Ninguna';

    const createdAt = `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`;
    const joinedAt = member?.joinedAt ? `<t:${Math.floor(member.joinedAt / 1000)}:F>` : 'Desconocido';
    const boostSince = member?.premiumSince ? `<t:${Math.floor(member.premiumSince / 1000)}:F>` : 'No está boosteando';

    const embed = {
      color: 0x00bfff,
      title: `Información de ${user.tag}`,
      thumbnail: { url: avatar },
      fields: [
        {
          name: '🆔 ID',
          value: `\`${user.id}\``,
          inline: false
        },
        {
          name: '📅 Cuenta creada el',
          value: createdAt,
          inline: true
        },
        {
          name: '🚪 Entró al servidor el',
          value: joinedAt,
          inline: true
        },
        {
          name: '🚀 Boostea desde',
          value: boostSince,
          inline: true
        },
        {
          name: '🎖️ Insignias',
          value: badges,
          inline: false
        },
        {
          name: '🎨 Avatar',
          value: `[Abrir avatar](${avatar})`,
          inline: false
        },
      ],
      footer: {
        text: `Solicitado por ${interaction.user.tag}`,
        icon_url: interaction.user.displayAvatarURL({ dynamic: true })
      },
      timestamp: new Date()
    };

    await interaction.reply({ embeds: [embed] });
  }

  // ========== COMANDO: /nombresanteriores ==========
  if (interaction.commandName === 'nombresanteriores') {
    const username = interaction.options.getString('usuario');
    await interaction.deferReply();

    try {
      const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
      const page = await browser.newPage();

      await page.goto(`https://www.roblox.com/users/profile?username=${encodeURIComponent(username)}`, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });

      const url = page.url();
      if (url.includes('user.aspx')) {
        await browser.close();
        return await interaction.editReply(`❌ El usuario **${username}** no fue encontrado.`);
      }

      const previousNames = await page.evaluate(() => {
        const el = document.querySelector('.previousNames');
        if (!el) return null;

        return el.innerText.replace('Previous usernames', '').trim().split(',').map(name => name.trim());
      });

      await browser.close();

      if (!previousNames || previousNames.length === 0) {
        await interaction.editReply(`🔍 El usuario **${username}** no tiene nombres anteriores visibles.`);
      } else {
        const embed = {
          color: 0x00bfff,
          title: `Nombres anteriores de ${username}`,
          fields: previousNames.map((name, index) => ({
            name: `#${index + 1}`,
            value: name,
            inline: true
          })),
          footer: {
            text: `Solicitado por ${interaction.user.tag}`,
            icon_url: interaction.user.displayAvatarURL({ dynamic: true })
          }
        };

        await interaction.editReply({ embeds: [embed] });
      }

    } catch (error) {
      console.error(error);
      await interaction.editReply('⚠️ Hubo un error al obtener los nombres anteriores.');
    }
  }

  // ========== COMANDO: /track ==========
  if (interaction.commandName === 'track') {
    const username = interaction.options.getString('usuario');
    await interaction.deferReply();

    try {
      const userRes = await axios.post(
        "https://users.roblox.com/v1/usernames/users",
        { usernames: [username], excludeBannedUsers: false }
      );

      if (!userRes.data?.data?.length) {
        return interaction.editReply(`❌ No encontré al usuario **${username}**.`);
      }

      const userId = userRes.data.data[0].id;

      const romonitor = await axios.get(
        `https://api.romonitorstats.com/v1/users/${userId}`
      );

      const data = romonitor.data;

      if (!data.activity || !data.activity.lastLocation) {
        return interaction.editReply(`⚠️ **${username}** no está jugando ahora mismo.`);
      }

      const loc = data.activity.lastLocation;

      const placeId = loc.placeId || "Desconocido";
      const gameName = loc.name || "Desconocido";
      const universeId = loc.universeId || "Desconocido";
      const joinScript = loc.joinScript || null;

      const embed = {
        title: `Tracking de ${username}`,
        color: 0x0099ff,
        fields: [
          { name: "🎮 Juego", value: gameName.toString() },
          { name: "📍 Place ID", value: placeId.toString() },
          { name: "🌌 Universe ID", value: universeId.toString() },
          { name: "🔗 Enlace", value: `https://www.roblox.com/games/${placeId}` }
        ],
        timestamp: new Date()
      };

      if (joinScript) {
        embed.fields.push({
          name: "📝 Join Script",
          value: `\`\`\`lua\n${joinScript}\n\`\`\``
        });
      }

      return interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error("Error en /track:", error.response?.data || error.message);
      return interaction.editReply("⚠️ Hubo un error al consultar los datos de RoMonitor.");
    }
  }
  if (interaction.commandName === 'setgradient') {
    try {
      const rol = interaction.options.getRole('rol');
      const color1 = interaction.options.getString('color1');
      const color2 = interaction.options.getString('color2');

      if (!interaction.guild.members.me.permissions.has('ManageRoles')) {
        return await interaction.reply({
          content: '❌ No tengo permisos para editar roles.',
          ephemeral: true,
        });
      }

      const botRole = interaction.guild.members.me.roles.highest;
      if (botRole.position <= rol.position) {
        return await interaction.reply({
          content: '❌ No puedo modificar este rol porque está por encima de mi rol más alto.',
          ephemeral: true,
        });
      }

      // Validar colores hexadecimales
      const hexRegex = /^#?([a-fA-F0-9]{6})$/;
      const match1 = color1.match(hexRegex);
      const match2 = color2.match(hexRegex);

      if (!match1 || !match2) {
        return await interaction.reply({
          content: '❌ Ambos colores deben estar en formato hexadecimal. Ejemplo: `#ff0000` o `ff0000`.',
          ephemeral: true,
        });
      }

      // Convertir hex a número decimal para Discord
      const colorInt1 = parseInt(match1[1], 16);
      const colorInt2 = parseInt(match2[1], 16);

      await interaction.deferReply();

      // Editar el rol con los dos colores (gradiente nativo de Discord)
      await rol.edit({
        color: colorInt1, // Color principal
        unicodeEmoji: null, // Remover emoji si tiene
      });

      // NOTA: Discord.js aún no tiene soporte completo para gradientes en la v14
      // Necesitamos usar la API REST directamente
      try {
        await axios.patch(
          `https://discord.com/api/v10/guilds/${interaction.guild.id}/roles/${rol.id}`,
          {
            color: colorInt1,
            color_two: colorInt2, // Segundo color para el gradiente
          },
          {
            headers: {
              Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
              'Content-Type': 'application/json',
            },
          }
        );

        await interaction.editReply(
          `✅ Degradado aplicado al rol **${rol.name}**\n🎨 Colores: \`#${match1[1]}\` → \`#${match2[1]}\`\n\n⚠️ **Nota:** El servidor necesita **boost nivel 3** para ver el degradado.`
        );
      } catch (apiError) {
        console.error('Error al aplicar gradiente con API:', apiError.response?.data || apiError.message);
        
        // Si falla, al menos aplicamos el primer color
        await interaction.editReply(
          `⚠️ No se pudo aplicar el degradado completo. Esto puede deberse a:\n• El servidor no tiene **boost nivel 3**\n• Discord aún no habilitó esta función para tu servidor\n\nSe aplicó el color \`#${match1[1]}\` al rol.`
        );
      }

    } catch (error) {
      console.error('Error en /setgradient:', error);
      await interaction.editReply({
        content: '❌ Ocurrió un error al aplicar el degradado.',
      });
    }
  }

});

// ========== FUNCIONES AUXILIARES ==========
async function obtenerUserId(username) {
  try {
    const res = await axios.post('https://users.roblox.com/v1/usernames/users', {
      usernames: [username],
      excludeBannedUsers: false,
    });
    return res.data.data.length ? res.data.data[0].id : null;
  } catch (err) {
    console.error('Error al obtener ID de usuario:', err.message);
    return null;
  }
}

async function obtenerGamepassesScraping(userId) {
  const url = `https://www.roblox.com/users/${userId}/inventory#!/game-passes`;
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  await page.waitForSelector('.item-card-container', { timeout: 10000 });

  const gamepasses = await page.evaluate(() => {
    const items = [];
    const elements = document.querySelectorAll('.item-card-container');
    elements.forEach(el => {
      const nameElement = el.querySelector('.text-overflow');
      const link = el.querySelector('a')?.href;
      const name = nameElement?.innerText?.trim();
      if (name && link) {
        items.push({ name, link });
      }
    });
    return items;
  });

  await browser.close();
  return gamepasses;
}

client.login(process.env.DISCORD_TOKEN);