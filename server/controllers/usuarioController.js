const db = require('../db/acessodados');
const { gerarToken } = require('../common/jwt');

async function login(req, res) {
    const { email, senha } = req.body || {};

    if (!email || !senha) {
        res.send(400, { erro: 'E-mail e senha são obrigatórios.' });
        return;
    }

    try {
        const result = await db.query(
            'SELECT id, nome, email FROM empresa WHERE email = $1 AND senha = $2',
            [email, senha]
        );

        if (result.rows.length === 0) {
            res.send(401, { erro: 'E-mail ou senha incorretos.' });
            return;
        }

        const usuario = result.rows[0];
        const token = gerarToken({ id: usuario.id, email: usuario.email });

        res.send(200, {
            mensagem: 'Login efetuado com sucesso',
            usuario,
            token
        });
    } catch (err) {
        console.error('Erro no login:', err);
        res.send(500, { erro: 'Erro interno ao realizar login.' });
    }
}

module.exports = {
    login
};