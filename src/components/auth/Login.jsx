import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { Loader } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user = await login(email, password);

      // Check role to redirect
      if (user.role === 'taller') {
        navigate('/workshop/dashboard');
      } else {
        navigate('/driver/vehicles');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#0B0E11]">
      <div className="max-w-md w-full space-y-8 bg-[#151921] p-8 rounded-xl border border-gray-800">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">Iniciar Sesión</h2>
          <p className="mt-2 text-gray-400">Accede a tu Pasaporte Global del Vehículo</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400">Correo Electrónico</label>
              <input
                type="email"
                required
                className="mt-1 block w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#1E5EFF]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400">Contraseña</label>
              <input
                type="password"
                required
                className="mt-1 block w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#1E5EFF]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#1E5EFF] hover:bg-[#3C7BFF] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E5EFF] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Entrar'}
          </button>

          <div className="text-center text-sm">
            <span className="text-gray-400">¿No tienes cuenta? </span>
            <Link to="/register" className="font-medium text-[#1E5EFF] hover:text-[#3C7BFF]">
              Regístrate gratis
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
