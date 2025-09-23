document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const messageElement = document.getElementById('message');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('http://localhost:3000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const result = await response.json();

            if (response.ok) {
                // Login bem-sucedido, armazena o token e redireciona
                localStorage.setItem('jwtToken', result.token);
                localStorage.setItem('isAdmin', result.user.is_admin);
                
                messageElement.textContent = 'Login realizado com sucesso! Redirecionando...';
                messageElement.classList.remove('hidden');
                messageElement.style.color = 'green';
                
                // Redireciona para a página principal ou outra página
                setTimeout(() => {
                    window.location.href = 'index.html'; 
                }, 1500);

            } else {
                // Login falhou, exibe a mensagem de erro da API
                messageElement.textContent = result.error || 'Erro no login. Credenciais inválidas.';
                messageElement.classList.remove('hidden');
                messageElement.style.color = 'red';
            }

        } catch (error) {
            console.error('Erro ao conectar com a API:', error);
            messageElement.textContent = 'Erro ao conectar com o servidor. Tente novamente.';
            messageElement.classList.remove('hidden');
            messageElement.style.color = 'red';
        }
    });
});