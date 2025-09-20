import { useState, useEffect } from 'react';

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

// O componente App é o principal de nossa aplicação.
export default function App() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Busca dados da rota /posts da nossa API.
    fetch('http://localhost:3000/posts')
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
  }, []); // O array vazio [] garante que o efeito só rode uma vez, na montagem do componente.

  return (
    <div className="flex flex-col items-center min-h-screen bg-slate-900 text-white font-inter p-8">
      <h1 className="text-4xl font-extrabold text-white my-8">
        Blog de Jogos
      </h1>
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
    </div>
  );
}
 