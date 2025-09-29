document.addEventListener('DOMContentLoaded', () => {
    const createPostForm = document.getElementById('create-post-form');
    const authStatus = document.getElementById('auth-status');
    const postsListBody = document.getElementById('posts-list-body');
    const listMessage = document.getElementById('list-message');
    const userToken = localStorage.getItem('userToken');
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const apiUrl = 'http://localhost:3000/posts';

    if (!userToken || !isAdmin) {
        authStatus.innerHTML = '<h1>Acesso Negado</h1><p>Você não tem permissão para acessar esta área. Faça login como administrador.</p><p><a href="login.html">Ir para Login</a></p>';
        return;
    }

    async function handleDelete(postId) {
        if (!confirm('Tem certeza que deseja DELETAR esta postagem? Esta ação é irreversível.')) {
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/${postId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${userToken}`
                }
            });

            if (response.ok) {
                listMessage.textContent = `Postagem ${postId} deletada com sucesso!`;
                listMessage.style.color = 'var(--cor-destaque)';
                fetchPosts();
            } else if (response.status === 403) {
                listMessage.textContent = 'Erro: Você não tem permissão de administrador.';
                listMessage.style.color = 'red';
            } else {
                throw new Error('Erro ao deletar a postagem.');
            }
        } catch (error) {
            console.error('Erro de rede:', error);
            listMessage.textContent = 'Erro de conexão com o servidor ao deletar.';
            listMessage.style.color = 'red';
        }
    }

    async function fetchPosts() {
        listMessage.textContent = 'Carregando postagens...';
        listMessage.style.color = 'yellow';
        postsListBody.innerHTML = '';

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error('Erro ao carregar a lista de postagens.');
            }
            const posts = await response.json();
            
            listMessage.textContent = '';
            
            if (posts.length === 0) {
                postsListBody.innerHTML = '<tr><td colspan="5">Nenhuma postagem encontrada.</td></tr>';
                return;
            }

            posts.forEach(post => {
                const row = postsListBody.insertRow();
                row.insertCell().textContent = post.id;
                row.insertCell().textContent = post.title;
                row.insertCell().textContent = post.author_username;
                row.insertCell().textContent = new Date(post.created_at).toLocaleDateString();

                const actionsCell = row.insertCell();
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Deletar';
                deleteButton.classList.add('delete-btn');
                deleteButton.onclick = () => handleDelete(post.id);
                actionsCell.appendChild(deleteButton);
            });

        } catch (error) {
            console.error('Erro:', error);
            listMessage.textContent = 'Erro ao carregar a lista de postagens.';
            listMessage.style.color = 'red';
        }
    }

    if (createPostForm) {
        createPostForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const title = document.getElementById('title').value;
            const content = document.getElementById('content').value;
            const imageUrl = document.getElementById('imageUrl').value;
            const messageElement = document.getElementById('message');

            messageElement.textContent = 'Enviando...';
            messageElement.style.color = 'yellow';

            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${userToken}`
                    },
                    body: JSON.stringify({ title, content, imageUrl })
                });

                const data = await response.json();

                if (response.ok) {
                    messageElement.textContent = data.message || 'Postagem criada com sucesso!';
                    messageElement.style.color = 'var(--cor-destaque)';
                    createPostForm.reset();
                    fetchPosts();
                } else if (response.status === 403) {
                    messageElement.textContent = 'Erro: Você não tem permissão de administrador.';
                    messageElement.style.color = 'red';
                } else {
                    messageElement.textContent = data.error || 'Erro ao criar a postagem.';
                    messageElement.style.color = 'red';
                }
            } catch (error) {
                console.error('Erro de rede:', error);
                messageElement.textContent = 'Erro de conexão com o servidor.';
                messageElement.style.color = 'red';
            }
        });
    }

    fetchPosts();
});