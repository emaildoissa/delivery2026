const cardapioController = require('../controllers/cardapioController');

module.exports = (server) => {
    server.get('/api/cardapio', cardapioController.listarCardapioCompleto);
    server.get('/api/produto/:id', cardapioController.detalharProduto);
};