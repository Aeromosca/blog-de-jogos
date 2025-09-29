document.addEventListener('DOMContentLoaded', () => {
    const loginLink = document.getElementById('login-link');
    const adminLink = document.getElementById('admin-link');
    const userToken = localStorage.getItem('userToken');
    const username = localStorage.getItem('username');
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    
    function handleLogout(e) {
        e.preventDefault();
        localStorage.removeItem('userToken');
        localStorage.removeItem('username');
        localStorage.removeItem('isAdmin');
        window.location.href = 'index.html';
    }

    if (userToken) {
        if (loginLink) {
            loginLink.textContent = `Olá, ${username} (Sair)`;
            loginLink.href = '#';
            loginLink.addEventListener('click', handleLogout);
        }

        if (isAdmin && adminLink) {
            adminLink.style.display = 'block';
            adminLink.href = 'admin.html';
        }
    } else {
        if (loginLink) {
            loginLink.textContent = 'Login';
            loginLink.href = 'login.html';
        }
    }
});