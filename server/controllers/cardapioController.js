const db = require('../db/acessodados');

// Busca todas as categorias e seus respectivos produtos (Área do Cliente)
async function listarCardapioCompleto(req, res, next) {
    try {
        // 1. Busca Categorias ativas
        const categoriasResult = await db.query(
            'SELECT id, nome, icone, ordem FROM categoria WHERE ativo = TRUE ORDER BY ordem ASC'
        );
        const categorias = categoriasResult.rows;

        // 2. Busca Produtos ativos
        const produtosResult = await db.query(
            'SELECT id, categoria_id, nome, descricao, valor, imagem, ordem FROM produto WHERE ativo = TRUE ORDER BY ordem ASC'
        );
        const produtos = produtosResult.rows;

        // Agrupa produtos dentro de suas categorias
        const cardapio = categorias.map(cat => ({
            ...cat,
            produtos: produtos.filter(prod => prod.categoria_id === cat.id)
        }));

        res.send(200, cardapio);
    } catch (err) {
        console.error('Erro ao listar cardápio:', err);
        res.send(500, { erro: 'Erro ao carregar cardápio.' });
    }
    return next();
}

// Busca detalhes de um produto específico com seus opcionais
async function detalharProduto(req, res, next) {
    const { id } = req.params;

    try {
        const prodResult = await db.query('SELECT * FROM produto WHERE id = \$1', [id]);
        if (prodResult.rows.length === 0) {
            res.send(404, { erro: 'Produto não encontrado.' });
            return next();
        }

        const produto = prodResult.rows[0];

        // Busca grupos de opcionais vinculados a este produto
        const opcionaisResult = await db.query(`
      SELECT o.id, o.titulo, o.minimo, o.maximo, o.obrigatorio
      FROM opcional o
      INNER JOIN produto_opcional po ON po.opcional_id = o.id
      WHERE po.produto_id = $1
    `, [id]);

        const opcionais = opcionaisResult.rows;

        // Para cada grupo, busca os itens adicionais
        for (let opc of opcionais) {
            const itensResult = await db.query(
                'SELECT id, nome, valor FROM opcional_item WHERE opcional_id = \$1 AND ativo = TRUE',
                [opc.id]
            );
            opc.itens = itensResult.rows;
        }

        produto.opcionais = opcionais;
        res.send(200, produto);
    } catch (err) {
        console.error('Erro ao detalhar produto:', err);
        res.send(500, { erro: 'Erro ao buscar detalhes do produto.' });
    }
    return next();
}

module.exports = {
    listarCardapioCompleto,
    detalharProduto
};