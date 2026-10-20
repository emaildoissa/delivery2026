let categoriasLista = [];
let produtosLista = [];
let modalProdutoInstancia = null;
let modalCategoriaInstancia = null;

document.addEventListener('DOMContentLoaded', () => {
    verificarAutenticacao();

    modalProdutoInstancia = new bootstrap.Modal(document.getElementById('modalProduto'));
    modalCategoriaInstancia = new bootstrap.Modal(document.getElementById('modalCategoria'));

    carregarDadosIniciais();
});

function verificarAutenticacao() {
    const token = localStorage.getItem('token_pizzaria');
    if (!token) {
        window.location.href = 'login.html';
    }
}

function logout() {
    localStorage.removeItem('token_pizzaria');
    localStorage.removeItem('usuario_pizzaria');
    window.location.href = 'login.html';
}

function alternarAba(aba) {
    const secaoProdutos = document.getElementById('secao-produtos');
    const secaoCategorias = document.getElementById('secao-categorias');
    const tabProdBtn = document.getElementById('tab-produtos-btn');
    const tabCatBtn = document.getElementById('tab-categorias-btn');

    if (aba === 'produtos') {
        secaoProdutos.classList.remove('d-none');
        secaoCategorias.classList.add('d-none');
        tabProdBtn.classList.add('active');
        tabCatBtn.classList.remove('active');
    } else {
        secaoProdutos.classList.add('d-none');
        secaoCategorias.classList.remove('d-none');
        tabProdBtn.classList.remove('active');
        tabCatBtn.classList.add('active');
    }
}

async function carregarDadosIniciais() {
    await carregarCategorias();
    await carregarProdutos();
}

// ==========================================
// CATEGORIAS
// ==========================================

async function carregarCategorias() {
    const token = localStorage.getItem('token_pizzaria');

    try {
        const res = await fetch(`${API_URL}/categorias`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Falha ao carregar categorias');

        categoriasLista = await res.json();
        document.getElementById('total-categorias').innerText = categoriasLista.length;

        renderizarTabelaCategorias();
        popularSelectCategorias();
    } catch (err) {
        console.error('Erro ao buscar categorias:', err);
    }
}

function renderizarTabelaCategorias() {
    const corpo = document.getElementById('tabela-categorias-corpo');

    if (!categoriasLista || categoriasLista.length === 0) {
        corpo.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4 text-muted">Nenhuma categoria cadastrada ainda.</td>
            </tr>
        `;
        return;
    }

    corpo.innerHTML = categoriasLista.map(cat => `
        <tr>
            <td class="fw-bold text-muted">${cat.ordem}</td>
            <td class="fw-bold">${cat.nome}</td>
            <td><i class="bi ${cat.icone || 'bi-tag'} fs-5 text-secondary"></i> <small class="text-muted ms-1">${cat.icone || ''}</small></td>
            <td>
                <span class="badge ${cat.ativo ? 'bg-success' : 'bg-secondary'} rounded-pill">
                    ${cat.ativo ? 'Ativa' : 'Inativa'}
                </span>
            </td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editarCategoria(${cat.id})" title="Editar">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="excluirCategoria(${cat.id})" title="Desativar">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function popularSelectCategorias() {
    const selectFiltro = document.getElementById('filtro-categoria');
    const selectModal = document.getElementById('prod-categoria');

    // Salva a seleção atual do filtro
    const filtroAtual = selectFiltro.value;

    selectFiltro.innerHTML = '<option value="">Todas as Categorias</option>' +
        categoriasLista.map(cat => `<option value="${cat.id}">${cat.nome}</option>`).join('');
    selectFiltro.value = filtroAtual;

    selectModal.innerHTML = '<option value="">Selecione...</option>' +
        categoriasLista.map(cat => `<option value="${cat.id}">${cat.nome}</option>`).join('');
}

function abrirModalCategoria() {
    document.getElementById('modalCategoriaTitulo').innerText = 'Nova Categoria';
    document.getElementById('cat-id').value = '';
    document.getElementById('cat-nome').value = '';
    document.getElementById('cat-icone').value = 'bi-tag';
    document.getElementById('cat-ordem').value = categoriasLista.length + 1;
    document.getElementById('cat-ativo').checked = true;

    modalCategoriaInstancia.show();
}

function editarCategoria(id) {
    const cat = categoriasLista.find(c => c.id === id);
    if (!cat) return;

    document.getElementById('modalCategoriaTitulo').innerText = 'Editar Categoria';
    document.getElementById('cat-id').value = cat.id;
    document.getElementById('cat-nome').value = cat.nome;
    document.getElementById('cat-icone').value = cat.icone || 'bi-tag';
    document.getElementById('cat-ordem').value = cat.ordem || 1;
    document.getElementById('cat-ativo').checked = cat.ativo;

    modalCategoriaInstancia.show();
}

async function salvarCategoria(event) {
    event.preventDefault();
    const token = localStorage.getItem('token_pizzaria');
    const id = document.getElementById('cat-id').value;

    const payload = {
        nome: document.getElementById('cat-nome').value.trim(),
        icone: document.getElementById('cat-icone').value.trim(),
        ordem: parseInt(document.getElementById('cat-ordem').value, 10) || 1,
        ativo: document.getElementById('cat-ativo').checked
    };

    const url = id ? `${API_URL}/categoria/${id}` : `${API_URL}/categoria`;
    const method = id ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.erro || 'Falha ao salvar categoria');

        modalCategoriaInstancia.hide();
        await carregarCategorias();
        await carregarProdutos(); // Atualiza produtos para refletir mudanças na categoria
    } catch (err) {
        alert(err.message);
    }
}

async function excluirCategoria(id) {
    if (!confirm('Deseja realmente desativar esta categoria? Os produtos vinculados a ela também serão desativados.')) return;

    const token = localStorage.getItem('token_pizzaria');

    try {
        const res = await fetch(`${API_URL}/categoria/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Erro ao desativar categoria');

        await carregarCategorias();
        await carregarProdutos();
    } catch (err) {
        alert(err.message);
    }
}

// ==========================================
// PRODUTOS
// ==========================================

async function carregarProdutos() {
    const token = localStorage.getItem('token_pizzaria');

    try {
        const res = await fetch(`${API_URL}/produtos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Falha ao carregar produtos');

        produtosLista = await res.json();
        document.getElementById('total-produtos').innerText = produtosLista.length;

        filtrarProdutosPorCategoria();
    } catch (err) {
        console.error('Erro ao buscar produtos:', err);
    }
}

function filtrarProdutosPorCategoria() {
    const categoriaId = document.getElementById('filtro-categoria').value;
    let filtrados = produtosLista;

    if (categoriaId) {
        filtrados = produtosLista.filter(p => p.categoria_id === parseInt(categoriaId, 10));
    }

    renderizarTabelaProdutos(filtrados);
}

function renderizarTabelaProdutos(produtos) {
    const corpo = document.getElementById('tabela-produtos-corpo');

    if (!produtos || produtos.length === 0) {
        corpo.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-muted">Nenhum produto cadastrado nesta categoria.</td>
            </tr>
        `;
        return;
    }

    corpo.innerHTML = produtos.map(prod => `
        <tr>
            <td>
                <img src="${prod.imagem || 'https://placehold.co/100x100?text=Item'}" 
                     class="img-produto-thumb" alt="${prod.nome}" onerror="this.src='https://placehold.co/100x100?text=Item'">
            </td>
            <td>
                <span class="fw-bold d-block">${prod.nome}</span>
                <small class="text-muted text-truncate d-inline-block" style="max-width: 250px;">${prod.descricao || 'Sem descrição'}</small>
            </td>
            <td>
                <span class="badge bg-light text-dark border">
                    ${prod.categoria_nome || 'Sem Categoria'}
                </span>
            </td>
            <td class="fw-bold text-danger">
                ${app.formatarMoeda(prod.valor)}
            </td>
            <td>
                <span class="badge ${prod.ativo ? 'bg-success' : 'bg-secondary'} rounded-pill">
                    ${prod.ativo ? 'Ativo' : 'Inativo'}
                </span>
            </td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editarProduto(${prod.id})" title="Editar">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="excluirProduto(${prod.id})" title="Desativar">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function abrirModalProduto() {
    if (categoriasLista.length === 0) {
        alert('Você precisa cadastrar ao menos uma categoria antes de criar um produto!');
        abrirModalCategoria();
        return;
    }

    document.getElementById('modalProdutoTitulo').innerText = 'Novo Produto';
    document.getElementById('prod-id').value = '';
    document.getElementById('prod-nome').value = '';
    document.getElementById('prod-categoria').value = '';
    document.getElementById('prod-valor').value = '';
    document.getElementById('prod-descricao').value = '';
    document.getElementById('prod-imagem').value = '';
    document.getElementById('prod-ordem').value = produtosLista.length + 1;
    document.getElementById('prod-ativo').checked = true;

    modalProdutoInstancia.show();
}

function editarProduto(id) {
    const prod = produtosLista.find(p => p.id === id);
    if (!prod) return;

    document.getElementById('modalProdutoTitulo').innerText = 'Editar Produto';
    document.getElementById('prod-id').value = prod.id;
    document.getElementById('prod-nome').value = prod.nome;
    document.getElementById('prod-categoria').value = prod.categoria_id;
    document.getElementById('prod-valor').value = parseFloat(prod.valor);
    document.getElementById('prod-descricao').value = prod.descricao || '';
    document.getElementById('prod-imagem').value = prod.imagem || '';
    document.getElementById('prod-ordem').value = prod.ordem || 1;
    document.getElementById('prod-ativo').checked = prod.ativo;

    modalProdutoInstancia.show();
}

async function salvarProduto(event) {
    event.preventDefault();
    const token = localStorage.getItem('token_pizzaria');
    const id = document.getElementById('prod-id').value;

    const payload = {
        categoria_id: parseInt(document.getElementById('prod-categoria').value, 10),
        nome: document.getElementById('prod-nome').value.trim(),
        descricao: document.getElementById('prod-descricao').value.trim(),
        valor: parseFloat(document.getElementById('prod-valor').value),
        imagem: document.getElementById('prod-imagem').value.trim() || null,
        ordem: parseInt(document.getElementById('prod-ordem').value, 10) || 1,
        ativo: document.getElementById('prod-ativo').checked
    };

    const url = id ? `${API_URL}/produto/${id}` : `${API_URL}/produto`;
    const method = id ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.erro || 'Falha ao salvar produto');

        modalProdutoInstancia.hide();
        await carregarProdutos();
    } catch (err) {
        alert(err.message);
    }
}

async function excluirProduto(id) {
    if (!confirm('Deseja realmente desativar este produto do cardápio?')) return;

    const token = localStorage.getItem('token_pizzaria');

    try {
        const res = await fetch(`${API_URL}/produto/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Erro ao desativar produto');

        await carregarProdutos();
    } catch (err) {
        alert(err.message);
    }
}
