// Configuração da URL da API (detecta ambiente local ou produção)
const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000/api'
    : 'https://api-pizzaria-potpourri.automacao.free.nf/api';

const app = {
    // Utilitário para requisições GET
    get: async (endpoint) => {
        try {
            const response = await fetch(`${API_URL}${endpoint}`);
            if (!response.ok) throw new Error('Erro na requisição');
            return await response.json();
        } catch (err) {
            console.error('Erro no GET:', err);
            return null;
        }
    },

    // Utilitário para requisições POST
    post: async (endpoint, data) => {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (err) {
            console.error('Erro no POST:', err);
            return null;
        }
    },

    // Gerenciamento do Carrinho no localStorage
    carrinho: {
        obter: () => {
            const itens = localStorage.getItem('carrinho_pizzaria');
            return itens ? JSON.parse(itens) : [];
        },
        salvar: (itens) => {
            localStorage.setItem('carrinho_pizzaria', JSON.stringify(itens));
        },
        adicionar: (novoItem) => {
            const itens = app.carrinho.obter();
            itens.push(novoItem);
            app.carrinho.salvar(itens);
        },
        limpar: () => {
            localStorage.removeItem('carrinho_pizzaria');
        },
        totalItens: () => {
            const itens = app.carrinho.obter();
            return itens.reduce((acc, item) => acc + item.quantidade, 0);
        }
    },

    // Formatação de Moeda (R$)
    formatarMoeda: (valor) => {
        return parseFloat(valor || 0).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    }
};