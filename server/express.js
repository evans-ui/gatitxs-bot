const express = require('express');

function startServer() {
  const app = express();

  app.get('/', (req, res) => {
    res.send('Bot está activo');
  });

  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
  });
}

module.exports = startServer;