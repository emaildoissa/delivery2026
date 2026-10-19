const pedidoController = require('../controllers/pedidoController');
const { verificarToken } = require('../common/jwt');

module.exports = (server) => {
    // Rota pública para cliente enviar pedido
    server.post('/api/pedido', pedidoController.criarPedido);

    // Rotas protegidas do Painel Administrativo
    server.get('/api/pedidos/status/:statusId', verificarToken, pedidoController.listarPorStatus);
    server.get('/api/pedido/:id', verificarToken, pedidoController.detalharPedido);
    server.put('/api/pedido/:id/status', verificarToken, pedidoController.atualizarStatus);
};