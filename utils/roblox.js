const axios = require('axios');

async function obtenerUserId(username) {
  try {
    const res = await axios.post(
      'https://users.roblox.com/v1/usernames/users',
      {
        usernames: [username],
        excludeBannedUsers: false
      }
    );

    return res.data?.data?.length
      ? res.data.data[0].id
      : null;

  } catch (err) {
    console.error('Error al obtener ID de usuario:', err.message);
    return null;
  }
}

async function buscarUsuario(username) {
  try {
    const res = await axios.post(
      'https://users.roblox.com/v1/usernames/users',
      {
        usernames: [username],
        excludeBannedUsers: false
      }
    );

    if (!res.data?.data?.length) {
      return null;
    }

    return res.data.data[0];

  } catch (err) {
    console.error('Error al buscar usuario de Roblox:', err.message);
    return null;
  }
}
module.exports = {
  obtenerUserId,
  buscarUsuario
};