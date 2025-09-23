async function fetchPosts() {
    try {
        const response = await fetch('http://localhost:3000/posts'); // A URL da sua API
        const posts = await response.json();

        const postsContainer = document.getElementById('posts-container');
        
        posts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.classList.add('post');

            postElement.innerHTML = `
                <h2>${post.title}</h2>
                <p>${post.content}</p>
                <small>Autor: ${post.author}</small>
            `;

            postsContainer.appendChild(postElement);
        });

    } catch (error) {
        console.error('Erro ao buscar os posts:', error);
        const postsContainer = document.getElementById('posts-container');
        postsContainer.innerHTML = '<p>Não foi possível carregar os posts. Tente novamente mais tarde.</p>';
    }
}

document.addEventListener('DOMContentLoaded', fetchPosts);