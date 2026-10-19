document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const pedidoId = params.get('id');

    if (pedidoId) {
        carregarPedido(pedidoId);
        // Atualiza a cada 15 segundos (polling)
        setInterval(() => carregarPedido(pedidoId), 15000);
    } else {
        document.getElementById('container-pedido').innerHTML = `
      <div class="text-center my-5">
        <i class="bi bi-search fs-1 text-muted d-block mb-3"></i>
        <p class="text-muted">Nenhum pedido selecionado para acompanhamento.</p>
        <a href="index.html" class="btn btn-danger rounded-pill px-4">Ver Cardápio</a>
      </div>
    `;
    }
});

async function carregarPedido(id) {
    const pedido = await app.get(`/pedido/${id}`);

    if (!pedido || !pedido.id) {
        document.getElementById('container-pedido').innerHTML = `
      <p class="text-center text-danger my-5">Pedido #${id} não encontrado.</p>
    `;
        return;
    }

    const statusId = pedido.pedido_status_id;

    let html = `
    <!-- Card de Status do Pedido -->
    <div class="card border-0 shadow-sm rounded-4 mb-3 text-center p-3">
      <h6 class="text-muted mb-1">Pedido #${pedido.id}</h6>
      <span class="badge fs-6 py-2 px-3 my-2 align-self-center rounded-pill" style="background-color: ${pedido.status_cor || '#6c757d'}">
        ${pedido.status_nome}
      </span>
      <small class="text-muted">Realizado em: ${new Date(pedido.criado_em).toLocaleString('pt-BR')}</small>
    </div>

    <!-- Linha do Tempo / Etapas -->
    <div class="card border-0 shadow-sm rounded-4 mb-3">
      <div class="card-body">
        <h6 class="fw-bold mb-3"><i class="bi bi-clock-history me-2"></i>Andamento</h6>
        
        <div class="d-flex align-items-center mb-3 ${statusId >= 1 ? 'text-success' : 'text-muted'}">
          <i class="bi bi-${statusId >= 1 ? 'check-circle-fill' : 'circle'} fs-5 me-3"></i>
          <div>
            <strong>Pedido Recebido</strong>
            <small class="d-block text-muted">Aguardando confirmação do restaurante</small>
          </div>
        </div>

        <div class="d-flex align-items-center mb-3 ${statusId >= 2 ? 'text-success' : 'text-muted'}">
          <i class="bi bi-${statusId >= 2 ? 'check-circle-fill' : 'circle'} fs-5 me-3"></i>
          <div>
            <strong>Pedido Aceito</strong>
            <small class="d-block text-muted">A cozinha já recebeu seu pedido</small>
          </div>
        </div>

        <div class="d-flex align-items-center mb-3 ${statusId >= 3 ? 'text-success' : 'text-muted'}">
          <i class="bi bi-${statusId >= 3 ? 'check-circle-fill' : 'circle'} fs-5 me-3"></i>
          <div>
            <strong>Em Preparo</strong>
            <small class="d-block text-muted">Seu pedido está no forno/sendo preparado</small>
          </div>
        </div>

        <div class="d-flex align-items-center mb-3 ${statusId >= 4 ? 'text-success' : 'text-muted'}">
          <i class="bi bi-${statusId >= 4 ? 'check-circle-fill' : 'circle'} fs-5 me-3"></i>
          <div>
            <strong>Em Entrega / Pronto</strong>
            <small class="d-block text-muted">${pedido.tipo_entrega_id === 1 ? 'O entregador está a caminho' : 'Disponível para retirada no balcão'}</small>
          </div>
        </div>

        <div class="d-flex align-items-center ${statusId === 5 ? 'text-success' : 'text-muted'}">
          <i class="bi bi-${statusId === 5 ? 'check-circle-fill' : 'circle'} fs-5 me-3"></i>
          <div>
            <strong>Concluído</strong>
            <small class="d-block text-muted">Pedido entregue e finalizado</small>
          </div>
        </div>
      </div>
    </div>

    <!-- Resumo dos Itens -->
    <div class="card border-0 shadow-sm rounded-4 mb-3">
      <div class="card-body">
        <h6 class="fw-bold mb-3"><i class="bi bi-bag me-2"></i>Itens Solicitados</h6>
        ${(pedido.itens || []).map(item => `
          <div class="d-flex justify-content-between py-2 border-bottom">
            <div>
              <span class="fw-bold">${item.quantidade}x ${item.produto_nome}</span>
              ${(item.opcionais || []).map(o => `<small class="text-muted d-block">+ ${o.opcional_item_nome}</small>`).join('')}
              ${item.observacao ? `<small class="text-secondary d-block fst-italic">Obs: ${item.observacao}</small>` : ''}
            </div>
            <span class="fw-bold text-dark">${app.formatarMoeda(item.valor_total)}</span>
          </div>
        `).join('')}
        
        <div class="d-flex justify-content-between mt-3 fw-bold fs-5">
          <span>Total</span>
          <span class="text-danger">${app.formatarMoeda(pedido.total)}</span>
        </div>
      </div>
    </div>
  `;

    document.getElementById('container-pedido').innerHTML = html;
}