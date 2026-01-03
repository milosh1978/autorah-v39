import { useState } from 'react';
import { X, AlertTriangle, Trash2, Lock } from 'lucide-react';

export default function DeleteAccountModal({ isOpen, onClose, onConfirm }) {
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!password) return;
    setIsDeleting(true);
    await onConfirm(password);
    setIsDeleting(false);
    setPassword('');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#151921] rounded-xl border border-red-900/50 w-full max-w-md p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          disabled={isDeleting}
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">¿Eliminar Cuenta?</h2>
          <p className="text-gray-400 text-sm">
            Esta acción es <span className="text-red-400 font-bold">irreversible</span>. 
            Tu cuenta será desactivada, tus datos anonimizados y tus vehículos retirados del Marketplace.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Ingresa tu contraseña para confirmar:
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="password"
                className="w-full bg-gray-900 border border-gray-700 rounded p-2 pl-9 text-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña actual"
                disabled={isDeleting}
              />
            </div>
          </div>

          <button 
            onClick={handleConfirm}
            disabled={!password || isDeleting}
            className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors ${
              password 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isDeleting ? (
              'Procesando...'
            ) : (
              <>
                <Trash2 className="w-5 h-5" />
                Eliminar mi cuenta permanentemente
              </>
            )}
          </button>
          
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="w-full py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
