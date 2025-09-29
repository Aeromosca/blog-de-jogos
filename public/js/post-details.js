document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    if (!postId) {
        document.getElementById('single-post').innerHTML = '<h2>Postagem não encontrada.</h2>';
        return; 
    }

    const apiUrl = `http://localhost:3000/posts/${postId}`;
    const singlePostContainer = document.getElementById('single-post');
    const commentsContainer = document.getElementById('comments-container');
    const pageTitle = document.getElementById('post-title');
    const commentForm = document.getElementById('comment-form');
    const commentsSection = document.getElementById('comments-section');
    const userToken = localStorage.getItem('userToken');

    function checkUserStatus() {
        if (userToken) {
            commentForm.style.display = 'block';
        } else {
            commentForm.style.display = 'none';
            const loginPrompt = document.createElement('p');
            loginPrompt.innerHTML = 'Faça <a href="login.html">login</a> para deixar um comentário ou curtir.';
            commentsSection.appendChild(loginPrompt);
        }
    }

    async function handleCommentSubmit(e) {
        e.preventDefault();
        
        const content = document.getElementById('comment-content').value;
        if (!content.trim()) return;

        try {
            const response = await fetch(`${apiUrl}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                },
                body: JSON.stringify({ content })
            });

            if (response.ok) {
                document.getElementById('comment-content').value = '';
                fetchPostDetails(); 
            } else if (response.status === 401 || response.status === 403) {
                alert('Sua sessão expirou ou o token é inválido. Faça login novamente.');
            } else {
                throw new Error('Erro ao adicionar o comentário.');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Não foi possível enviar o comentário.');
        }
    }

    async function handleLikeClick() {
        if (!userToken) {
            alert('Você precisa estar logado para curtir uma postagem.');
            window.location.href = 'login.html';
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/likes`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${userToken}`
                }
            });

            if (response.ok) {
                fetchPostDetails(); 
            } else if (response.status === 401 || response.status === 403) {
                alert('Sua sessão expirou ou o token é inválido. Faça login novamente.');
            } else {
                throw new Error('Erro ao processar a curtida.');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Não foi possível realizar a ação.');
        }
    }

    async function fetchPostDetails() {
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Postagem não encontrada.');
                }
                throw new Error('Erro ao buscar os detalhes da postagem.');
            }
            const data = await response.json();
            
            const likesCount = data.likes_count || 0;
            const isLiked = data.is_liked_by_user || false;
            const buttonText = isLiked ? `Descurtir (${likesCount})` : `Curtir (${likesCount})`;
            
            pageTitle.textContent = data.title;
            singlePostContainer.innerHTML = `
                <article class="full-post">
                    ${data.image_url ? `<img src="css/images/${data.image_url}" alt="${data.title}">` : ''}
                    <h1>${data.title}</h1>
                    <small>Por: ${data.author_username} em ${new Date(data.created_at).toLocaleDateString()}</small>
                    <div class="post-content">
                        ${data.content}
                    </div>
                    <button id="like-button" class="${isLiked ? 'liked' : ''}">${buttonText}</button> 
                </article>
            `;
            
            const likeButton = document.getElementById('like-button');
            if (likeButton) {
                likeButton.removeEventListener('click', handleLikeClick);
                likeButton.addEventListener('click', handleLikeClick);
            }

            commentsContainer.innerHTML = ''; 
            if (data.comments && data.comments.length > 0) {
                data.comments.forEach(comment => {
                    const commentElement = document.createElement('div');
                    commentElement.classList.add('comment');
                    commentElement.innerHTML = `
                        <p><strong>${comment.user_username}</strong>: ${comment.content}</p>
                        <small>${new Date(comment.created_at).toLocaleDateString()}</small>
                    `;
                    commentsContainer.appendChild(commentElement);
                });
            } else {
                commentsContainer.innerHTML = '<p>Seja o primeiro a comentar!</p>';
            }
            
            commentForm.removeEventListener('submit', handleCommentSubmit);
            commentForm.addEventListener('submit', handleCommentSubmit);
            checkUserStatus();

        } catch (error) {
            console.error('Erro:', error);
            singlePostContainer.innerHTML = `<p style="color:red;">${error.message}</p>`;
        }
    }

    fetchPostDetails();
});