const usuarioController = require('../controllers/usuarioController');

module.exports = (server) => {
    server.post('/api/login', usuarioController.login);
};