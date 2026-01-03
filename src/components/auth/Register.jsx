import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { Car, Wrench, Loader } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [role, setRole] = useState('conductor'); // 'conductor' or 'taller'
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    city: '',
    country: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await register({
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        role: role,
        phone: formData.phone,
        city: formData.city,
        country: formData.country,
        created_at: new Date().toISOString()
      });

      navigate(role === 'taller' ? '/workshop/dashboard' : '/driver/vehicles');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Hubo un error al registrar. Por favor revisa tus datos e inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#0B0E11]">
      <div className="max-w-md w-full space-y-8 bg-[#151921] p-8 rounded-xl border border-gray-800">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">Crear Cuenta</h2>
          <p className="mt-2 text-gray-400">Únete a la red global de AUTORAH</p>
        </div>

        {/* Role Selection */}
        <div className="flex gap-4 justify-center mt-6">
          <button
            type="button"
            onClick={() => setRole('conductor')}
            className={`flex-1 flex flex-col items-center p-4 rounded-lg border transition-all ${
              role === 'conductor' 
                ? 'bg-[#1E5EFF]/10 border-[#1E5EFF] text-[#1E5EFF]' 
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Car className="w-6 h-6 mb-2" />
            <span className="font-medium">Soy Conductor</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('taller')}
            className={`flex-1 flex flex-col items-center p-4 rounded-lg border transition-all ${
              role === 'taller' 
                ? 'bg-[#1E5EFF]/10 border-[#1E5EFF] text-[#1E5EFF]' 
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Wrench className="w-6 h-6 mb-2" />
            <span className="font-medium">Soy Taller</span>
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400">Nombre Completo / Nombre del Taller</label>
              <input
                name="fullName"
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#1E5EFF]"
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400">Correo Electrónico</label>
              <input
                name="email"
                type="email"
                required
                className="mt-1 block w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#1E5EFF]"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400">Contraseña</label>
              <input
                name="password"
                type="password"
                required
                className="mt-1 block w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#1E5EFF]"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400">País</label>
                <input
                  name="country"
                  type="text"
                  required
                  className="mt-1 block w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#1E5EFF]"
                  value={formData.country}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400">Ciudad</label>
                <input
                  name="city"
                  type="text"
                  required
                  className="mt-1 block w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#1E5EFF]"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#1E5EFF] hover:bg-[#3C7BFF] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E5EFF] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Registrarse'}
          </button>

          <div className="text-center text-sm">
            <span className="text-gray-400">¿Ya tienes cuenta? </span>
            <Link to="/login" className="font-medium text-[#1E5EFF] hover:text-[#3C7BFF]">
              Inicia Sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
