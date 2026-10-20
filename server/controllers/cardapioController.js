const db = require('../db/acessodados');

// 1. Busca todas as categorias e seus respectivos produtos (Área do Cliente)
async function listarCardapioCompleto(req, res) {
    try {
        const categoriasResult = await db.query(
            'SELECT id, nome, icone, ordem FROM categoria WHERE ativo = TRUE ORDER BY ordem ASC'
        );
        const categorias = categoriasResult.rows;

        const produtosResult = await db.query(
            'SELECT id, categoria_id, nome, descricao, valor, imagem, ordem FROM produto WHERE ativo = TRUE ORDER BY ordem ASC'
        );
        const produtos = produtosResult.rows;

        const cardapio = categorias.map(cat => ({
            ...cat,
            produtos: produtos.filter(prod => prod.categoria_id === cat.id)
        }));

        res.send(200, cardapio);
    } catch (err) {
        console.error('Erro ao listar cardápio:', err);
        res.send(500, { erro: 'Erro ao carregar cardápio.' });
    }
}

// 2. Busca detalhes de um produto específico com seus opcionais (Área do Cliente)
async function detalharProduto(req, res) {
    const { id } = req.params;

    try {
        const prodResult = await db.query('SELECT * FROM produto WHERE id = $1', [id]);
        if (prodResult.rows.length === 0) {
            res.send(404, { erro: 'Produto não encontrado.' });
            return;
        }

        const produto = prodResult.rows[0];

        const opcionaisResult = await db.query(`
            SELECT o.id, o.titulo, o.minimo, o.maximo, o.obrigatorio
            FROM opcional o
            INNER JOIN produto_opcional po ON po.opcional_id = o.id
            WHERE po.produto_id = $1
        `, [id]);

        const opcionais = opcionaisResult.rows;

        for (let opc of opcionais) {
            const itensResult = await db.query(
                'SELECT id, nome, valor FROM opcional_item WHERE opcional_id = $1 AND ativo = TRUE',
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
}

// ==========================================
// MÓDULO DE GESTÃO - PAINEL ADMINISTRATIVO
// ==========================================

// 3. Listar todas as categorias (Admin)
async function listarCategorias(req, res) {
    try {
        const result = await db.query('SELECT * FROM categoria ORDER BY ordem ASC, id ASC');
        res.send(200, result.rows);
    } catch (err) {
        console.error('Erro ao listar categorias:', err);
        res.send(500, { erro: 'Erro ao listar categorias.' });
    }
}

// 4. Criar nova categoria (Admin)
async function criarCategoria(req, res) {
    const { nome, icone, ordem, ativo } = req.body || {};

    if (!nome) {
        res.send(400, { erro: 'O nome da categoria é obrigatório.' });
        return;
    }

    try {
        const result = await db.query(
            `INSERT INTO categoria (nome, icone, ordem, ativo)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [nome, icone || 'bi-tag', ordem || 1, ativo !== undefined ? ativo : true]
        );

        res.send(201, {
            mensagem: 'Categoria criada com sucesso!',
            categoria: result.rows[0]
        });
    } catch (err) {
        console.error('Erro ao criar categoria:', err);
        res.send(500, { erro: 'Erro ao criar categoria.' });
    }
}

// 5. Atualizar categoria (Admin)
async function atualizarCategoria(req, res) {
    const { id } = req.params;
    const { nome, icone, ordem, ativo } = req.body || {};

    if (!nome) {
        res.send(400, { erro: 'O nome da categoria é obrigatório.' });
        return;
    }

    try {
        const result = await db.query(
            `UPDATE categoria
             SET nome = $1, icone = $2, ordem = $3, ativo = $4
             WHERE id = $5
             RETURNING *`,
            [nome, icone || 'bi-tag', ordem || 1, ativo !== undefined ? ativo : true, id]
        );

        if (result.rows.length === 0) {
            res.send(404, { erro: 'Categoria não encontrada.' });
            return;
        }

        res.send(200, {
            mensagem: 'Categoria atualizada com sucesso!',
            categoria: result.rows[0]
        });
    } catch (err) {
        console.error('Erro ao atualizar categoria:', err);
        res.send(500, { erro: 'Erro ao atualizar categoria.' });
    }
}

// 6. Deletar/Desativar categoria (Admin)
async function deletarCategoria(req, res) {
    const { id } = req.params;

    try {
        // Desativa a categoria e os produtos vinculados a ela
        await db.query('UPDATE categoria SET ativo = FALSE WHERE id = $1', [id]);
        await db.query('UPDATE produto SET ativo = FALSE WHERE categoria_id = $1', [id]);

        res.send(200, { mensagem: 'Categoria desativada com sucesso!' });
    } catch (err) {
        console.error('Erro ao desativar categoria:', err);
        res.send(500, { erro: 'Erro ao desativar categoria.' });
    }
}

// 7. Listar todos os produtos com nome da categoria (Admin)
async function listarTodosProdutos(req, res) {
    try {
        const query = `
            SELECT p.*, c.nome AS categoria_nome
            FROM produto p
            LEFT JOIN categoria c ON c.id = p.categoria_id
            ORDER BY c.ordem ASC, p.ordem ASC, p.id ASC
        `;
        const result = await db.query(query);
        res.send(200, result.rows);
    } catch (err) {
        console.error('Erro ao listar produtos admin:', err);
        res.send(500, { erro: 'Erro ao listar produtos.' });
    }
}

// 8. Criar novo produto (Admin)
async function criarProduto(req, res) {
    const { categoria_id, nome, descricao, valor, imagem, ordem, ativo } = req.body || {};

    if (!categoria_id || !nome || valor === undefined) {
        res.send(400, { erro: 'Categoria, nome e valor são obrigatórios.' });
        return;
    }

    try {
        const result = await db.query(
            `INSERT INTO produto (categoria_id, nome, descricao, valor, imagem, ordem, ativo)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [
                categoria_id,
                nome,
                descricao || '',
                parseFloat(valor),
                imagem || null,
                ordem || 1,
                ativo !== undefined ? ativo : true
            ]
        );

        res.send(201, {
            mensagem: 'Produto cadastrado com sucesso!',
            produto: result.rows[0]
        });
    } catch (err) {
        console.error('Erro ao cadastrar produto:', err);
        res.send(500, { erro: 'Erro ao cadastrar produto.' });
    }
}

// 9. Atualizar produto existente (Admin)
async function atualizarProduto(req, res) {
    const { id } = req.params;
    const { categoria_id, nome, descricao, valor, imagem, ordem, ativo } = req.body || {};

    if (!categoria_id || !nome || valor === undefined) {
        res.send(400, { erro: 'Categoria, nome e valor são obrigatórios.' });
        return;
    }

    try {
        const result = await db.query(
            `UPDATE produto
             SET categoria_id = $1, nome = $2, descricao = $3, valor = $4, imagem = $5, ordem = $6, ativo = $7
             WHERE id = $8
             RETURNING *`,
            [
                categoria_id,
                nome,
                descricao || '',
                parseFloat(valor),
                imagem || null,
                ordem || 1,
                ativo !== undefined ? ativo : true,
                id
            ]
        );

        if (result.rows.length === 0) {
            res.send(404, { erro: 'Produto não encontrado.' });
            return;
        }

        res.send(200, {
            mensagem: 'Produto atualizado com sucesso!',
            produto: result.rows[0]
        });
    } catch (err) {
        console.error('Erro ao atualizar produto:', err);
        res.send(500, { erro: 'Erro ao atualizar produto.' });
    }
}

// 10. Deletar/Desativar produto (Admin)
async function deletarProduto(req, res) {
    const { id } = req.params;

    try {
        await db.query('UPDATE produto SET ativo = FALSE WHERE id = $1', [id]);
        res.send(200, { mensagem: 'Produto desativado com sucesso!' });
    } catch (err) {
        console.error('Erro ao desativar produto:', err);
        res.send(500, { erro: 'Erro ao desativar produto.' });
    }
}

module.exports = {
    listarCardapioCompleto,
    detalharProduto,
    listarCategorias,
    criarCategoria,
    atualizarCategoria,
    deletarCategoria,
    listarTodosProdutos,
    criarProduto,
    atualizarProduto,
    deletarProduto
};