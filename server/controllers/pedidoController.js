const db = require('../db/acessodados');

// 1. Criar novo pedido (Área do Cliente)
async function criarPedido(req, res, next) {
    const {
        cliente_nome,
        cliente_telefone,
        tipo_entrega_id,
        forma_pagamento_id,
        troco_para,
        cep,
        endereco,
        numero,
        bairro,
        cidade,
        complemento,
        subtotal,
        taxa_entrega,
        total,
        observacao,
        itens
    } = req.body;

    if (!cliente_nome || !cliente_telefone || !itens || itens.length === 0) {
        res.send(400, { erro: 'Dados incompletos para a criação do pedido.' });
        return next();
    }

    // Utiliza uma transação SQL no Postgres para garantir atomicidade
    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        // Insere o cabeçalho do pedido (Status 1 = Pendente)
        const pedidoSql = `
      INSERT INTO pedido (
        cliente_nome, cliente_telefone, tipo_entrega_id, forma_pagamento_id,
        troco_para, cep, endereco, numero, bairro, cidade, complemento,
        subtotal, taxa_entrega, total, pedido_status_id, observacao
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 1, $15)
      RETURNING id
    `;

        const pedidoParams = [
            cliente_nome, cliente_telefone, tipo_entrega_id, forma_pagamento_id,
            troco_para || null, cep, endereco, numero, bairro, cidade, complemento,
            subtotal, taxa_entrega || 0.00, total, observacao
        ];

        const pedidoResult = await client.query(pedidoSql, pedidoParams);
        const pedidoId = pedidoResult.rows[0].id;

        // Insere os itens do pedido
        for (const item of itens) {
            const itemSql = `
        INSERT INTO pedido_item (
          pedido_id, produto_id, produto_nome, quantidade, valor_unitario, valor_total, observacao
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `;

            const itemParams = [
                pedidoId, item.produto_id, item.produto_nome,
                item.quantidade, item.valor_unitario, item.valor_total, item.observacao
            ];

            const itemResult = await client.query(itemSql, itemParams);
            const itemId = itemResult.rows[0].id;

            // Insere os opcionais/adicionais selecionados para este item
            if (item.opcionais && item.opcionais.length > 0) {
                for (const opc of item.opcionais) {
                    const opcSql = `
            INSERT INTO pedido_item_opcional (pedido_item_id, opcional_item_nome, valor)
            VALUES ($1, $2, $3)
          `;
                    await client.query(opcSql, [itemId, opc.nome, opc.valor]);
                }
            }
        }

        await client.query('COMMIT');

        res.send(201, {
            sucesso: true,
            mensagem: 'Pedido realizado com sucesso!',
            pedido_id: pedidoId
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erro ao criar pedido:', err);
        res.send(500, { erro: 'Erro ao processar o pedido.' });
    } finally {
        client.release();
    }

    return next();
}

// 2. Listar pedidos por status (Painel Administrativo)
async function listarPorStatus(req, res, next) {
    const { statusId } = req.params;

    try {
        const result = await db.query(`
      SELECT p.id, p.cliente_nome, p.cliente_telefone, p.total, p.criado_em,
             te.nome AS tipo_entrega, fp.nome AS forma_pagamento, ps.nome AS status_nome, ps.cor AS status_cor
      FROM pedido p
      LEFT JOIN tipo_entrega te ON te.id = p.tipo_entrega_id
      LEFT JOIN forma_pagamento fp ON fp.id = p.forma_pagamento_id
      LEFT JOIN pedido_status ps ON ps.id = p.pedido_status_id
      WHERE p.pedido_status_id = $1
      ORDER BY p.id DESC
    `, [statusId]);

        res.send(200, result.rows);
    } catch (err) {
        console.error('Erro ao listar pedidos:', err);
        res.send(500, { erro: 'Erro ao carregar lista de pedidos.' });
    }

    return next();
}

// 3. Detalhes completos do pedido (Modal do Painel)
async function detalharPedido(req, res, next) {
    const { id } = req.params;

    try {
        const pedidoResult = await db.query(`
      SELECT p.*, te.nome AS tipo_entrega_nome, fp.nome AS forma_pagamento_nome, ps.nome AS status_nome
      FROM pedido p
      LEFT JOIN tipo_entrega te ON te.id = p.tipo_entrega_id
      LEFT JOIN forma_pagamento fp ON fp.id = p.forma_pagamento_id
      LEFT JOIN pedido_status ps ON ps.id = p.pedido_status_id
      WHERE p.id = $1
    `, [id]);

        if (pedidoResult.rows.length === 0) {
            res.send(404, { erro: 'Pedido não encontrado.' });
            return next();
        }

        const pedido = pedidoResult.rows[0];

        // Busca itens do pedido
        const itensResult = await db.query(
            'SELECT * FROM pedido_item WHERE pedido_id = \$1',
            [id]
        );

        const itens = itensResult.rows;

        for (let item of itens) {
            const opcResult = await db.query(
                'SELECT opcional_item_nome, valor FROM pedido_item_opcional WHERE pedido_item_id = \$1',
                [item.id]
            );
            item.opcionais = opcResult.rows;
        }

        pedido.itens = itens;

        res.send(200, pedido);
    } catch (err) {
        console.error('Erro ao detalhar pedido:', err);
        res.send(500, { erro: 'Erro ao carregar detalhes do pedido.' });
    }

    return next();
}

// 4. Atualizar o status do pedido (Pendente -> Aceito -> Em Preparo -> Concluído)
async function atualizarStatus(req, res, next) {
    const { id } = req.params;
    const { pedido_status_id } = req.body;

    if (!pedido_status_id) {
        res.send(400, { erro: 'O novo status é obrigatório.' });
        return next();
    }

    try {
        await db.query(
            'UPDATE pedido SET pedido_status_id = \$1 WHERE id = \$2',
            [pedido_status_id, id]
        );

        res.send(200, { mensagem: 'Status do pedido atualizado com sucesso!' });
    } catch (err) {
        console.error('Erro ao atualizar status:', err);
        res.send(500, { erro: 'Erro ao atualizar status do pedido.' });
    }

    return next();
}

module.exports = {
    criarPedido,
    listarPorStatus,
    detalharPedido,
    atualizarStatus
};