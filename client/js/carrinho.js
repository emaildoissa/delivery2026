let taxaEntrega = 5.00; // Taxa padrão inicial

document.addEventListener('DOMContentLoaded', () => {
    renderizarCarrinho();
});

function renderizarCarrinho() {
    const itens = app.carrinho.obter();
    const container = document.getElementById('lista-carrinho');

    if (itens.length === 0) {
        container.innerHTML = '<p class="text-center text-muted my-4">Seu carrinho está vazio.</p>';
        atualizarResumo(0);
        return;
    }

    let subtotal = 0;
    let html = '';

    itens.forEach((item, index) => {
        subtotal += item.valor_total;
        html += `
      <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
        <div>
          <h6 class="fw-bold mb-0">${item.quantidade}x ${item.produto_nome}</h6>
          ${(item.opcionais || []).map(o => `<small class="text-muted d-block">+ ${o.nome}</small>`).join('')}
          ${item.observacao ? `<small class="text-secondary fst-italic">Obs: ${item.observacao}</small>` : ''}
          <span class="fw-bold text-danger d-block mt-1">${app.formatarMoeda(item.valor_total)}</span>
        </div>
        <button class="btn btn-sm btn-outline-danger border-0" onclick="removerItem(${index})">
          <i class="bi bi-trash fs-5"></i>
        </button>
      </div>
    `;
    });

    container.innerHTML = html;
    atualizarResumo(subtotal);
}

function removerItem(index) {
    const itens = app.carrinho.obter();
    itens.splice(index, 1);
    app.carrinho.salvar(itens);
    renderizarCarrinho();
}

function alternarEntrega() {
    const isDelivery = document.getElementById('entrega-delivery').checked;
    document.getElementById('secao-endereco').style.display = isDelivery ? 'block' : 'none';
    taxaEntrega = isDelivery ? 5.00 : 0.00;
    renderizarCarrinho();
}

function verificarTroco() {
    const forma = document.getElementById('forma_pagamento').value;
    const campoTroco = document.getElementById('campo-troco');
    if (forma === '4') { // Dinheiro
        campoTroco.classList.remove('d-none');
    } else {
        campoTroco.classList.add('d-none');
    }
}

function atualizarResumo(subtotal) {
    document.getElementById('resumo-subtotal').innerText = app.formatarMoeda(subtotal);
    document.getElementById('resumo-taxa').innerText = app.formatarMoeda(taxaEntrega);
    document.getElementById('resumo-total').innerText = app.formatarMoeda(subtotal + taxaEntrega);
}

async function enviarPedido() {
    const itens = app.carrinho.obter();
    if (itens.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }

    const nome = document.getElementById('cliente_nome').value;
    const telefone = document.getElementById('cliente_telefone').value;

    if (!nome || !telefone) {
        alert('Por favor, preencha seu nome e telefone.');
        return;
    }

    const tipoEntrega = document.querySelector('input[name="tipo_entrega"]:checked').value;
    const subtotal = itens.reduce((a, b) => a + b.valor_total, 0);

    const payload = {
        cliente_nome: nome,
        cliente_telefone: telefone,
        tipo_entrega_id: parseInt(tipoEntrega),
        forma_pagamento_id: parseInt(document.getElementById('forma_pagamento').value),
        troco_para: parseFloat(document.getElementById('troco_para')?.value) || null,
        endereco: document.getElementById('end_rua')?.value || '',
        numero: document.getElementById('end_numero')?.value || '',
        bairro: document.getElementById('end_bairro')?.value || '',
        complemento: document.getElementById('end_complemento')?.value || '',
        subtotal: subtotal,
        taxa_entrega: taxaEntrega,
        total: subtotal + taxaEntrega,
        itens: itens
    };

    const resposta = await app.post('/pedido', payload);

    if (resposta && resposta.sucesso) {
        app.carrinho.limpar();
        alert('Pedido enviado com sucesso!');
        window.location.href = `pedido.html?id=${resposta.pedido_id}`;
    } else {
        alert('Erro ao enviar pedido. Tente novamente.');
    }
}