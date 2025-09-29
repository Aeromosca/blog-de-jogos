const express = require('express');
const cors = require('cors');
const db = require('./database/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const app = express();
const port = 3000;

const JWT_SECRET = 'sua_super_chave_secreta_e_complexa'; 

app.use(cors());

app.use(express.json());

app.use(express.static(path.join(__dirname, 'public'))); 

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/status', async (req, res) => {
    try {
        const result = await db.query('SELECT NOW() as now');
        res.send(`A hora atual do banco de dados é: ${result.rows[0].now}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao conectar ao banco de dados.');
    }
});


const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ error: 'Token não fornecido.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido ou expirado.' });
        }
        req.user = user;
        next();
    });
};

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'E-mail já cadastrado.' });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const newUser = await db.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
            [username, email, password_hash]
        );

        res.status(201).json({
            message: 'Usuário cadastrado com sucesso!',
            user: newUser.rows[0],
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro no servidor. Tente novamente mais tarde.' });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = userResult.rows[0];

        if (!user) {
            return res.status(400).json({ error: 'Credenciais inválidas.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Credenciais inválidas.' });
        }

        const token = jwt.sign(
            { id: user.id, isAdmin: user.is_admin },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            message: 'Login bem-sucedido!',
            token,
            user: { id: user.id, username: user.username, email: user.email, is_admin: user.is_admin }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro no servidor. Tente novamente mais tarde.' });
    }
});

app.post('/posts', authenticateToken, async (req, res) => {
    const { title, content, imageUrl } = req.body;
    const authorId = req.user.id;
    const isAdmin = req.user.isAdmin;

    if (!isAdmin) {
        return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem criar postagens.' });
    }

    try {
        const newPost = await db.query(
            'INSERT INTO posts (title, content, image_url, author_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [title, content, imageUrl, authorId]
        );
        res.status(201).json({
            message: 'Postagem criada com sucesso!',
            post: newPost.rows[0],
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar a postagem.' });
    }
});

app.get('/posts', async (req, res) => {
    try {
        const allPosts = await db.query(`
            SELECT
                p.id,
                p.title,
                p.content,
                p.image_url,
                p.created_at,
                u.username AS author_username
            FROM posts p
            JOIN users u ON p.author_id = u.id
            ORDER BY p.created_at DESC
        `);
        res.status(200).json(allPosts.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar as postagens.' });
    }
});

app.get('/posts/:id', async (req, res) => {
    const { id } = req.params;
    let userId = null;

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        try {
            const user = jwt.verify(token, JWT_SECRET);
            userId = user.id;
        } catch (err) {
        }
    }

    try {
        const postResult = await db.query(`
            SELECT
                p.id,
                p.title,
                p.content,
                p.image_url,
                p.created_at,
                u.username AS author_username
            FROM posts p
            JOIN users u ON p.author_id = u.id
            WHERE p.id = $1
        `, [id]);

        const post = postResult.rows[0];

        if (!post) {
            return res.status(404).json({ error: 'Postagem não encontrada.' });
        }

        const likesCountResult = await db.query(
            'SELECT COUNT(*) FROM likes WHERE post_id = $1',
            [id]
        );
        const likesCount = parseInt(likesCountResult.rows[0].count);

        let isLikedByUser = false;
        if (userId) {
            const likedResult = await db.query(
                'SELECT * FROM likes WHERE post_id = $1 AND user_id = $2',
                [id, userId]
            );
            isLikedByUser = likedResult.rows.length > 0;
        }

        const commentsResult = await db.query(`
            SELECT
                c.id,
                c.content,
                c.created_at,
                u.username AS user_username
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.post_id = $1
            ORDER BY c.created_at ASC
        `, [id]);

        res.status(200).json({
            ...post,
            comments: commentsResult.rows,
            likes_count: likesCount,
            is_liked_by_user: isLikedByUser,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar a postagem.' });
    }
});

app.post('/posts/:id/comments', authenticateToken, async (req, res) => {
    const postId = req.params.id;
    const userId = req.user.id;
    const { content } = req.body;

    try {
        const newComment = await db.query(
            'INSERT INTO comments (content, user_id, post_id) VALUES ($1, $2, $3) RETURNING *',
            [content, userId, postId]
        );
        res.status(201).json({
            message: 'Comentário adicionado com sucesso!',
            comment: newComment.rows[0],
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao adicionar o comentário.' });
    }
});

app.post('/posts/:id/likes', authenticateToken, async (req, res) => {
    const postId = req.params.id;
    const userId = req.user.id;

    try {
        const likeExists = await db.query(
            'SELECT * FROM likes WHERE user_id = $1 AND post_id = $2',
            [userId, postId]
        );

        if (likeExists.rows.length > 0) {
            await db.query(
                'DELETE FROM likes WHERE user_id = $1 AND post_id = $2',
                [userId, postId]
            );
            res.status(200).json({ message: 'Postagem descurtida com sucesso.' });
        } else {
            await db.query(
                'INSERT INTO likes (user_id, post_id) VALUES ($1, $2)',
                [userId, postId]
            );
            res.status(200).json({ message: 'Postagem curtida com sucesso!' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao processar a curtida.' });
    }
});

app.delete('/posts/:id', authenticateToken, async (req, res) => {
    const postId = req.params.id;
    const isAdmin = req.user.isAdmin;

    if (!isAdmin) {
        return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem deletar postagens.' });
    }

    try {
        const deletedPost = await db.query(
            'DELETE FROM posts WHERE id = $1 RETURNING *',
            [postId]
        );

        if (deletedPost.rows.length === 0) {
            return res.status(404).json({ error: 'Postagem não encontrada.' });
        }

        res.status(200).json({ message: 'Postagem deletada com sucesso!', post: deletedPost.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao deletar a postagem.' });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});