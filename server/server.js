require('dotenv').config();
const restify = require('restify');
const cors = require('cors');

const server = restify.createServer({
    name: 'API-Pizzaria',
    version: '1.0.0'
});

// 1. CORS e Preflight tratados na fase PRE (antes do roteamento)
server.pre((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-access-token');

    // Se for OPTIONS (preflight do navegador), responde 204 imediatamente
    if (req.method.toUpperCase() === 'OPTIONS') {
        return res.send(204);
    }
    return next();
});

// 2. Middlewares padrão do Restify
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