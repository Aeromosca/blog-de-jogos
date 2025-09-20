import { useState, useEffect } from 'react';

// URL do seu backend
const API_URL = 'http://localhost:3000';

// Componente para exibir um único post
const PostCard = ({ post }) => {
  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-lg mb-6 w-full max-w-2xl">
      <h2 className="text-2xl font-bold text-teal-400 mb-2">{post.title}</h2>
      <p className="text-slate-300 mb-4">{post.content}</p>
      {post.image_url && (
        <img 
          src={post.image_url} 
          alt={post.title} 
          className="rounded-lg mb-4 w-full h-48 object-cover"
        />
      )}
      <div className="text-sm text-slate-500">
        <p>Por: <span className="text-slate-400">{post.author_username}</span></p>
        <p>Publicado em: {new Date(post.created_at).toLocaleDateString('pt-BR')}</p>
      </div>
    </div>
  );
};

// Componente de Login
const LoginForm = ({ onLoginSuccess, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro no login.');
      }

      onLoginSuccess(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800 p-8 rounded-lg shadow-lg w-full max-w-sm flex flex-col items-center">
      <h2 className="text-2xl font-bold text-white mb-6">Login</h2>
      <input
        type="email"
        placeholder="E-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-3 mb-4 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
        required
      />
      <input
        type="password"
        placeholder="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-3 mb-4 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
        required
      />
      <button
        type="submit"
        className="w-full p-3 rounded-md bg-teal-600 hover:bg-teal-700 font-bold text-white transition-colors"
        disabled={loading}
      >
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
      {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}
      <p className="mt-4 text-sm text-slate-400">
        Não tem uma conta?{' '}
        <span
          className="text-teal-400 cursor-pointer hover:underline"
          onClick={onSwitchToRegister}
        >
          Cadastre-se
        </span>
      </p>
    </form>
  );
};

// Componente de Cadastro
const RegisterForm = ({ onSwitchToLogin }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro no cadastro.');
      }
      setSuccess('Cadastro realizado com sucesso! Faça login para continuar.');
      onSwitchToLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800 p-8 rounded-lg shadow-lg w-full max-w-sm flex flex-col items-center">
      <h2 className="text-2xl font-bold text-white mb-6">Cadastro</h2>
      <input
        type="text"
        placeholder="Nome de Usuário"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="w-full p-3 mb-4 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
        required
      />
      <input
        type="email"
        placeholder="E-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-3 mb-4 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
        required
      />
      <input
        type="password"
        placeholder="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-3 mb-4 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
        required
      />
      <button
        type="submit"
        className="w-full p-3 rounded-md bg-teal-600 hover:bg-teal-700 font-bold text-white transition-colors"
        disabled={loading}
      >
        {loading ? 'Cadastrando...' : 'Cadastrar'}
      </button>
      {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}
      {success && <p className="text-green-500 mt-4 text-sm">{success}</p>}
      <p className="mt-4 text-sm text-slate-400">
        Já tem uma conta?{' '}
        <span
          className="text-teal-400 cursor-pointer hover:underline"
          onClick={onSwitchToLogin}
        >
          Entrar
        </span>
      </p>
    </form>
  );
};

// O componente App é o principal de nossa aplicação.
export default function App() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('home'); // 'home', 'login', 'register'

  useEffect(() => {
    // Busca dados da rota /posts da nossa API.
    fetch(`${API_URL}/posts`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Erro ao buscar postagens.');
        }
        return response.json();
      })
      .then(result => {
        setPosts(result);
        setError(null);
      })
      .catch(err => {
        setError(err.message);
        setPosts([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleLoginSuccess = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setIsLoggedIn(true);
    setCurrentUser(user);
    setView('home');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setCurrentUser(null);
    setView('home');
  };

  const renderView = () => {
    switch (view) {
      case 'login':
        return <LoginForm onLoginSuccess={handleLoginSuccess} onSwitchToRegister={() => setView('register')} />;
      case 'register':
        return <RegisterForm onSwitchToLogin={() => setView('login')} />;
      case 'home':
      default:
        return (
          <>
            <p className="text-xl text-slate-400 mb-8 text-center">
              Aqui estão todas as postagens do seu blog.
            </p>
            {loading && <p className="text-xl text-slate-400">Carregando postagens...</p>}
            {error && <p className="text-red-500 text-lg">Erro: {error}</p>}
            
            {!loading && posts.length === 0 && (
              <p className="text-xl text-slate-400">Nenhuma postagem encontrada.</p>
            )}

            {!loading && posts.length > 0 && (
              <div className="w-full flex flex-col items-center">
                {posts.map(post => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </>
        );
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-slate-900 text-white font-inter p-8">
      <nav className="w-full max-w-3xl flex justify-between items-center mb-8">
        <h1 className="text-4xl font-extrabold text-white">
          Blog de Jogos
        </h1>
        <div className="flex space-x-4">
          {!isLoggedIn && (
            <>
              <button onClick={() => setView('login')} className="px-4 py-2 rounded-md bg-teal-600 hover:bg-teal-700 transition-colors">
                Login
              </button>
              <button onClick={() => setView('register')} className="px-4 py-2 rounded-md bg-slate-700 hover:bg-slate-600 transition-colors">
                Cadastro
              </button>
            </>
          )}
          {isLoggedIn && (
            <>
              <span className="text-slate-400 self-center">Olá, {currentUser?.username}!</span>
              <button onClick={handleLogout} className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 transition-colors">
                Sair
              </button>
            </>
          )}
        </div>
      </nav>
      {renderView()}
    </div>
  );
}
