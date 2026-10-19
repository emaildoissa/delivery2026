require('dotenv').config();
const restify = require('restify');
const cors = require('cors');

const server = restify.createServer({
    name: 'API-Pizzaria',
    version: '1.0.0'
});

// Configuração robusta de CORS para o Restify
const corsMiddleware = cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token']
});

server.pre(corsMiddleware);
server.use(corsMiddleware);

// Middleware para garantir os cabeçalhos de CORS em todas as respostas
server.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-access-token');
    return next();
});

// Tratamento explícito para Preflight Requests (OPTIONS)
server.opts('/*', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-access-token');
    res.send(204);
    return next();
});

// Fallback para quando o Restify emitir MethodNotAllowed em requisições OPTIONS
server.on('MethodNotAllowed', (req, res) => {
    if (req.method.toUpperCase() === 'OPTIONS') {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-access-token');
        return res.send(204);
    }
    return res.send(405);
});

// Middlewares padrão do Restify
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