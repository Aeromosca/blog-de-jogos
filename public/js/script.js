document.addEventListener('DOMContentLoaded', () => {
    const postsContainer = document.getElementById('posts-container');
    const apiUrl = 'http://localhost:3000/posts';
    const loginLink = document.getElementById('login-link');

    // Funções de Autenticação Básica (Logout)
    function handleLogout() {
        localStorage.removeItem('userToken');
        localStorage.removeItem('username');
        localStorage.removeItem('isAdmin');
        window.location.reload(); 
    }

    if (localStorage.getItem('userToken')) {
        const username = localStorage.getItem('username');
        loginLink.textContent = `Olá, ${username} (Sair)`;
        loginLink.addEventListener('click', handleLogout);
    } else {
        loginLink.href = 'login.html';
        loginLink.textContent = 'Login';
    }


    // Função para buscar e exibir as postagens
    async function fetchPosts() {
        try {
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                // Se a API retornar um erro, lança uma exceção.
                // A mensagem de erro "Servidor indisponível" que você vê indica que o fetch falhou.
                // Verifique seu PostgreSQL!
                throw new Error('Erro ao buscar as postagens. Verifique o servidor PostgreSQL.');
            }
            
            const posts = await response.json();
            
            postsContainer.innerHTML = '';
            if (posts.length === 0) {
                postsContainer.innerHTML = '<p>Nenhuma postagem encontrada.</p>';
                return;
            }
            
            posts.forEach(post => {
                const postElement = document.createElement('article');
                postElement.classList.add('post');

                postElement.innerHTML = `
                    ${post.image_url ? `<img src="${post.image_url}" alt="${post.title}">` : ''}
                    
                    <h2>
                        <a href="post.html?id=${post.id}">${post.title}</a>
                    </h2>
                    
                    <p>${post.content.substring(0, 150)}...</p>
                    <small>Por: ${post.author_username} em ${new Date(post.created_at).toLocaleDateString()}</small>
                `;
                postsContainer.appendChild(postElement);
            });

        } catch (error) {
            console.error('Erro ao buscar os posts:', error);
            postsContainer.innerHTML = `<p style="color:red;">Não foi possível carregar os posts: ${error.message}</p>`;
        }
    }

    fetchPosts();
});