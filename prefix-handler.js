// prefix-handler.js
module.exports = async (client, message, prefix) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'ping') {
    return message.reply('🏓 ¡Pong!');
  }

  if (command === 'say') {
    const texto = args.join(' ');
    if (!texto) return message.reply('❗ Escribe algo para decir.');
    return message.channel.send(texto);
  }

  if (command === 'avatar') {
    return message.reply(message.author.displayAvatarURL({ dynamic: true }));
  }
};