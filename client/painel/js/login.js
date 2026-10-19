async function efetuarLogin() {
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;
    const alerta = document.getElementById('alerta-erro');

    if (!email || !senha) {
        alerta.innerText = 'Preencha todos os campos.';
        alerta.classList.remove('d-none');
        return;
    }

    const resposta = await app.post('/login', { email, senha });

    if (resposta && resposta.token) {
        // Guarda o token e os dados do usuário logado
        localStorage.setItem('token_pizzaria', resposta.token);
        localStorage.setItem('usuario_pizzaria', JSON.stringify(resposta.usuario));
        window.location.href = 'pedidos.html';
    } else {
        alerta.innerText = resposta?.erro || 'Falha ao autenticar. Verifique seus dados.';
        alerta.classList.remove('d-none');
    }
}