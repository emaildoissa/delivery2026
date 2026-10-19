document.addEventListener('DOMContentLoaded', () => {
    carregarCardapio();
    atualizarBadgeCarrinho();
});

async function carregarCardapio() {
    const cardapio = await app.get('/cardapio');

    if (!cardapio || cardapio.length === 0) {
        document.getElementById('conteudo-cardapio').innerHTML = `
      <div class="text-center my-5">
        <p class="text-muted">Nenhum produto cadastrado no momento.</p>
      </div>
    `;
        return;
    }

    // Renderiza botões de categoria
    const categoriasHTML = cardapio.map((cat, index) => `
    <a href="#cat-${cat.id}" class="categoria-btn ${index === 0 ? 'active' : ''}">
      ${cat.nome}
    </a>
  `).join('');
    document.getElementById('lista-categorias').innerHTML = categoriasHTML;

    // Renderiza categorias e produtos
    const cardapioHTML = cardapio.map(cat => `
    <div id="cat-${cat.id}" class="mb-4">
      <h5 class="fw-bold mb-3 border-bottom pb-2">${cat.nome}</h5>
      <div class="row">
        ${(cat.produtos || []).map(prod => `
          <div class="col-12 col-md-6">
            <div class="card card-produto p-3 d-flex flex-row align-items-center" onclick="irParaItem(${prod.id})">
              <div class="flex-grow-1 pe-2">
                <h6 class="fw-bold mb-1">${prod.nome}</h6>
                <p class="small text-muted mb-2 text-truncate" style="max-width: 200px;">${prod.descricao || ''}</p>
                <span class="fw-bold text-danger">${app.formatarMoeda(prod.valor)}</span>
              </div>
              <div>
                <img src="${prod.imagem || 'https://placehold.co/100x100?text=Item'}" class="rounded" width="80" height="80" style="object-fit: cover;">
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

    document.getElementById('conteudo-cardapio').innerHTML = cardapioHTML;
}

function irParaItem(id) {
    window.location.href = `item.html?id=${id}`;
}

function atualizarBadgeCarrinho() {
    const total = app.carrinho.totalItens();
    const badge = document.getElementById('badge-carrinho');
    if (badge) badge.innerText = total;
}