const cardapioController = require('../controllers/cardapioController');
const { verificarToken } = require('../common/jwt');

module.exports = (server) => {
    // Rotas públicas (Área do Cliente)
    server.get('/api/cardapio', cardapioController.listarCardapioCompleto);
    server.get('/api/produto/:id', cardapioController.detalharProduto);

    // Rotas protegidas (Painel Administrativo)
    // Categorias
    server.get('/api/categorias', verificarToken, cardapioController.listarCategorias);
    server.post('/api/categoria', verificarToken, cardapioController.criarCategoria);
    server.put('/api/categoria/:id', verificarToken, cardapioController.atualizarCategoria);
    server.del('/api/categoria/:id', verificarToken, cardapioController.deletarCategoria);

    // Produtos
    server.get('/api/produtos', verificarToken, cardapioController.listarTodosProdutos);
    server.post('/api/produto', verificarToken, cardapioController.criarProduto);
    server.put('/api/produto/:id', verificarToken, cardapioController.atualizarProduto);
    server.del('/api/produto/:id', verificarToken, cardapioController.deletarProduto);
};