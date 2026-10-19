let produtoAtual = null;
let quantidade = 1;
let opcionaisSelecionados = [];

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (id) {
        carregarDetalhes(id);
    } else {
        window.location.href = 'index.html';
    }
});

async function carregarDetalhes(id) {
    produtoAtual = await app.get(`/produto/${id}`);

    if (!produtoAtual || !produtoAtual.id) {
        document.getElementById('container-produto').innerHTML = '<p class="text-center text-danger">Produto não encontrado.</p>';
        return;
    }

    let html = `
    <div class="card border-0 shadow-sm rounded-4 overflow-hidden mb-3">
      <img src="${produtoAtual.imagem || 'https://placehold.co/500x250?text=Produto'}" class="w-100" style="max-height: 250px; object-fit: cover;">
      <div class="card-body">
        <h4 class="fw-bold mb-1">${produtoAtual.nome}</h4>
        <p class="text-muted small">${produtoAtual.descricao || ''}</p>
        <span class="fw-bold text-danger fs-5">${app.formatarMoeda(produtoAtual.valor)}</span>
      </div>
    </div>
  `;

    // Renderiza Grupos de Opcionais (se existirem)
    if (produtoAtual.opcionais && produtoAtual.opcionais.length > 0) {
        produtoAtual.opcionais.forEach(grupo => {
            html += `
        <div class="card border-0 shadow-sm rounded-4 mb-3">
          <div class="card-header bg-white py-3 border-0">
            <h6 class="fw-bold mb-0">${grupo.titulo}</h6>
            <small class="text-muted">${grupo.obrigatorio ? 'Obrigatório • ' : ''}Escolha de ${grupo.minimo} até ${grupo.maximo}</small>
          </div>
          <div class="card-body pt-0">
            ${(grupo.itens || []).map(item => `
              <div class="form-check d-flex justify-content-between align-items-center py-2 border-bottom">
                <div>
                  <input class="form-check-input opcional-checkbox" type="checkbox" 
                         value="${item.id}" 
                         data-nome="${item.nome}" 
                         data-valor="${item.valor}"
                         data-grupo="${grupo.id}"
                         id="opc-${item.id}"
                         onchange="atualizarTotal()">
                  <label class="form-check-label ms-2" for="opc-${item.id}">${item.nome}</label>
                </div>
                <span class="text-muted small">+ ${app.formatarMoeda(item.valor)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
        });
    }

    // Campo de Observação
    html += `
    <div class="card border-0 shadow-sm rounded-4 mb-5">
      <div class="card-body">
        <label class="form-label fw-bold"><i class="bi bi-chat-left-text me-2"></i>Observações</label>
        <textarea id="obs-item" class="form-control" rows="2" placeholder="Ex: Sem cebola, caprichar no orégano..."></textarea>
      </div>
    </div>
  `;

    document.getElementById('container-produto').innerHTML = html;
    atualizarTotal();
}

function alterarQtd(delta) {
    if (quantidade + delta >= 1) {
        quantidade += delta;
        document.getElementById('qtd-item').innerText = quantidade;
        atualizarTotal();
    }
}

function atualizarTotal() {
    if (!produtoAtual) return;

    let valorUnitario = parseFloat(produtoAtual.valor);
    opcionaisSelecionados = [];

    const checkboxes = document.querySelectorAll('.opcional-checkbox:checked');
    checkboxes.forEach(cb => {
        const val = parseFloat(cb.getAttribute('data-valor')) || 0;
        valorUnitario += val;
        opcionaisSelecionados.push({
            id: cb.value,
            nome: cb.getAttribute('data-nome'),
            valor: val
        });
    });

    const totalGeral = valorUnitario * quantidade;
    document.getElementById('btn-total-valor').innerText = app.formatarMoeda(totalGeral);
}

function adicionarAoCarrinho() {
    const obs = document.getElementById('obs-item')?.value || '';

    const itemCarrinho = {
        produto_id: produtoAtual.id,
        produto_nome: produtoAtual.nome,
        quantidade: quantidade,
        valor_unitario: parseFloat(produtoAtual.valor),
        valor_total: (parseFloat(produtoAtual.valor) + opcionaisSelecionados.reduce((a, b) => a + b.valor, 0)) * quantidade,
        observacao: obs,
        opcionais: opcionaisSelecionados
    };

    app.carrinho.adicionar(itemCarrinho);
    window.location.href = 'carrinho.html';
}