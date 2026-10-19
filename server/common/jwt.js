const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'P#9xmK!2vLq8%zB#wRt5^yFp*4xGh7';

// Gera o Token JWT válido por 24 horas
function gerarToken(payload) {
    return jwt.sign(payload, SECRET, { expiresIn: '24h' });
}

// Middleware de verificação do Token nas rotas protegidas
function verificarToken(req, res, next) {
    const token = req.headers['authorization'] || req.headers['x-access-token'];

    if (!token) {
        res.send(401, { erro: 'Acesso negado. Token não fornecido.' });
        return false;
    }

    try {
        const rawToken = token.replace('Bearer ', '');
        const decoded = jwt.verify(rawToken, SECRET);
        req.usuarioLogado = decoded;
        return next();
    } catch (err) {
        res.send(403, { erro: 'Token inválido ou expirado.' });
        return false;
    }
}

module.exports = {
    gerarToken,
    verificarToken
};