const express = require('express');
const cors = require('cors'); // Importa o pacote CORS
const db = require('./database/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();
const port = 3000;

// Chave secreta para assinar os tokens JWT. Mantenha isso em segredo!
const JWT_SECRET = 'sua_super_chave_secreta_e_complexa'; 

// Adiciona o middleware CORS para permitir requisições do front-end
app.use(cors());

// Middleware para processar requisições com corpo em JSON
app.use(express.json());

// Middleware para autenticar o token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Formato: Bearer TOKEN

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

// Rota de teste para verificar a conexão com o banco de dados
app.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW() as now');
    res.send(`A hora atual do banco de dados é: ${result.rows[0].now}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao conectar ao banco de dados.');
  }
});

// Rota para cadastro de novos usuários
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // 1. Verificar se o e-mail já está cadastrado
    const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'E-mail já cadastrado.' });
    }

    // 2. Gerar o hash da senha
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // 3. Inserir o novo usuário no banco de dados
    const newUser = await db.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, password_hash]
    );

    // 4. Enviar uma resposta de sucesso
    res.status(201).json({
      message: 'Usuário cadastrado com sucesso!',
      user: newUser.rows[0],
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor. Tente novamente mais tarde.' });
  }
});

// Rota para login de usuários
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Encontrar o usuário pelo e-mail
    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    // 2. Se o usuário não existe, retorne um erro
    if (!user) {
      return res.status(400).json({ error: 'Credenciais inválidas.' });
    }

    // 3. Comparar a senha fornecida com a senha criptografada no banco
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Credenciais inválidas.' });
    }

    // 4. Se as senhas coincidem, crie um JWT
    const token = jwt.sign(
      { id: user.id, isAdmin: user.is_admin },
      JWT_SECRET,
      { expiresIn: '1h' } // Token expira em 1 hora
    );

    // 5. Envie o token na resposta
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

// Rota para criar uma nova postagem (requer autenticação de admin)
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

// Rota para buscar todas as postagens (acesso público)
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

// Rota para buscar uma única postagem por ID
app.get('/posts/:id', async (req, res) => {
  const { id } = req.params;

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
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar a postagem.' });
  }
});

// Rota para adicionar um comentário a uma postagem (requer autenticação)
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

// Rota para curtir ou descurtir uma postagem (requer autenticação)
app.post('/posts/:id/likes', authenticateToken, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;

  try {
    // 1. Verificar se o usuário já curtiu a postagem
    const likeExists = await db.query(
      'SELECT * FROM likes WHERE user_id = $1 AND post_id = $2',
      [userId, postId]
    );

    if (likeExists.rows.length > 0) {
      // Se já curtiu, remova a curtida (descurtir)
      await db.query(
        'DELETE FROM likes WHERE user_id = $1 AND post_id = $2',
        [userId, postId]
      );
      res.status(200).json({ message: 'Postagem descurtida com sucesso.' });
    } else {
      // Se ainda não curtiu, adicione a curtida
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

// Rota para deletar uma postagem (requer autenticação de admin)
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

// Inicia o servidor na porta especificada
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
