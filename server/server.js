require('dotenv').config();
const restify = require('restify');
const cors = require('cors');

const server = restify.createServer({
    name: 'API-Pizzaria',
    version: '1.0.0'
});

// Middlewares
server.use(cors());
server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());

// Rota de Health Check
server.get('/health', (req, res, next) => {
    res.send(200, { status: 'API Online no Docker', timestamp: new Date() });
    return next();
});

// Registro das Rotas do Sistema
require('./routes/usuarioRoute')(server);
require('./routes/cardapioRoute')(server);
require('./routes/pedidoRoute')(server);

// Inicialização
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});