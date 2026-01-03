import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { Menu, X, Car, Wrench, LogOut, User } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="bg-[#0B0E11] border-b border-gray-800 text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 bg-[#1E5EFF] rounded-lg flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-wider">AUTORAH</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link to="/" className="hover:text-[#1E5EFF] px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Home
              </Link>
              <Link to="/marketplace" className="hover:text-[#1E5EFF] px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Marketplace
              </Link>
              
              {user && profile?.role === 'conductor' && (
                <Link to="/driver/vehicles" className="hover:text-[#1E5EFF] px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Mis Vehículos
                </Link>
              )}

              {user && profile?.role === 'taller' && (
                <Link to="/workshop/dashboard" className="hover:text-[#1E5EFF] px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Panel Taller
                </Link>
              )}

              <Link to="/deposit" className="hover:text-[#1E5EFF] px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Depósito Digital
              </Link>
            </div>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:block">
            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400 flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {profile?.full_name || user.email}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Salir
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                    Acceder
                  </Link>
                  <Link to="/register" className="bg-[#1E5EFF] hover:bg-[#3C7BFF] px-4 py-2 rounded-md text-sm font-medium transition-colors">
                    Registrarse
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#0B0E11] border-b border-gray-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/" className="block hover:bg-gray-800 px-3 py-2 rounded-md text-base font-medium">Home</Link>
            <Link to="/marketplace" className="block hover:bg-gray-800 px-3 py-2 rounded-md text-base font-medium">Marketplace</Link>
            
            {user && profile?.role === 'conductor' && (
              <Link to="/driver/vehicles" className="block hover:bg-gray-800 px-3 py-2 rounded-md text-base font-medium">Mis Vehículos</Link>
            )}
            
            {user && profile?.role === 'taller' && (
              <Link to="/workshop/dashboard" className="block hover:bg-gray-800 px-3 py-2 rounded-md text-base font-medium">Panel Taller</Link>
            )}

            <Link to="/deposit" className="block hover:bg-gray-800 px-3 py-2 rounded-md text-base font-medium">Depósito Digital</Link>

            {!user && (
              <>
                <Link to="/login" className="block hover:bg-gray-800 px-3 py-2 rounded-md text-base font-medium">Acceder</Link>
                <Link to="/register" className="block bg-[#1E5EFF] px-3 py-2 rounded-md text-base font-medium mt-2">Registrarse</Link>
              </>
            )}
            
            {user && (
              <button onClick={handleSignOut} className="w-full text-left block hover:bg-gray-800 px-3 py-2 rounded-md text-base font-medium text-red-400">
                Cerrar Sesión
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
