let statusAtual = 1;

document.addEventListener('DOMContentLoaded', () => {
    verificarAutenticacao();
    carregarPedidosPorStatus(statusAtual);
    // Auto-refresh dos pedidos a cada 10 segundos
    setInterval(() => carregarPedidosPorStatus(statusAtual), 10000);
});

function verificarAutenticacao() {
    const token = localStorage.getItem('token_pizzaria');
    if (!token) {
        window.location.href = 'login.html';
    }
}

function filtrarStatus(statusId, event) {
    statusAtual = statusId;
    document.querySelectorAll('.nav-link').forEach(btn => btn.classList.remove('active'));
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
    carregarPedidosPorStatus(statusId);
}

async function carregarPedidosPorStatus(statusId) {
    const token = localStorage.getItem('token_pizzaria');

    try {
        const res = await fetch(`${API_URL}/pedidos/status/${statusId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const pedidos = await res.json();

        const container = document.getElementById('container-pedidos-admin');

        if (!pedidos || pedidos.length === 0) {
            container.innerHTML = '<div class="col-12"><p class="text-muted">Nenhum pedido neste status.</p></div>';
            return;
        }

        container.innerHTML = pedidos.map(p => `
      <div class="col-12 col-md-6 col-lg-4 mb-3">
        <div class="card card-pedido-admin shadow-sm p-3 bg-white">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h6 class="fw-bold mb-0">Pedido #${p.id}</h6>
            <small class="text-muted">${new Date(p.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</small>
          </div>
          <p class="mb-1"><strong>Cliente:</strong> ${p.cliente_nome}</p>
          <p class="mb-1"><strong>WhatsApp:</strong> ${p.cliente_telefone}</p>
          <p class="mb-1"><strong>Pagamento:</strong> ${p.forma_pagamento || 'N/I'}</p>
          <p class="fw-bold text-danger fs-5 my-2">${app.formatarMoeda(p.total)}</p>

          <div class="d-flex gap-2 mt-2">
            ${statusAtual === 1 ? `<button class="btn btn-sm btn-success flex-grow-1" onclick="mudarStatus(${p.id}, 2)">Aceitar Pedido</button>` : ''}
            ${statusAtual === 2 ? `<button class="btn btn-sm btn-warning flex-grow-1" onclick="mudarStatus(${p.id}, 3)">Iniciar Preparo</button>` : ''}
            ${statusAtual === 3 ? `<button class="btn btn-sm btn-primary flex-grow-1" onclick="mudarStatus(${p.id}, 4)">Despachar Entrega</button>` : ''}
            ${statusAtual === 4 ? `<button class="btn btn-sm btn-dark flex-grow-1" onclick="mudarStatus(${p.id}, 5)">Concluir Pedido</button>` : ''}
            ${statusAtual !== 5 && statusAtual !== 6 ? `<button class="btn btn-sm btn-outline-danger" onclick="mudarStatus(${p.id}, 6)">Recusar</button>` : ''}
          </div>
        </div>
      </div>
    `).join('');
    } catch (err) {
        console.error('Erro ao carregar pedidos admin:', err);
    }
}

async function mudarStatus(pedidoId, novoStatusId) {
    const token = localStorage.getItem('token_pizzaria');
    await fetch(`${API_URL}/pedido/${pedidoId}/status`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ pedido_status_id: novoStatusId })
    });

    carregarPedidosPorStatus(statusAtual);
}

function logout() {
    localStorage.removeItem('token_pizzaria');
    localStorage.removeItem('usuario_pizzaria');
    window.location.href = 'login.html';
}