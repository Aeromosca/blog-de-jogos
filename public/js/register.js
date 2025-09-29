document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const errorMessage = document.getElementById('error-message');
    const apiUrl = 'http://localhost:3000/register';

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        errorMessage.textContent = '';
        errorMessage.style.display = 'none';

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                alert('Cadastro realizado com sucesso! Faça login para continuar.');
                window.location.href = 'login.html'; 

            } else {
                errorMessage.textContent = data.error || 'Erro desconhecido durante o cadastro.';
                errorMessage.style.display = 'block';
            }
        } catch (error) {
            errorMessage.textContent = 'Não foi possível conectar ao servidor para registrar.';
            errorMessage.style.display = 'block';
        }
    });
});