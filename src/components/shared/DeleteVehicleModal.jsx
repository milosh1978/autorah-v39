import { useState } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

export default function DeleteVehicleModal({ isOpen, onClose, onConfirm, vehicle }) {
  const [confirmPlate, setConfirmPlate] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !vehicle) return null;

  const isConfirmed = confirmPlate === vehicle.plate;

  const handleConfirm = async () => {
    if (!isConfirmed) return;
    setIsDeleting(true);
    await onConfirm();
    setIsDeleting(false);
    setConfirmPlate('');
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
          <h2 className="text-2xl font-bold text-white mb-2">¿Eliminar Vehículo?</h2>
          <p className="text-gray-400">
            Esta acción moverá el vehículo <span className="text-white font-bold">{vehicle.plate}</span> a la papelera.
            Dejará de ser visible en "Mis Vehículos" y en el Marketplace.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Escribe la placa <span className="text-white font-mono font-bold">{vehicle.plate}</span> para confirmar:
            </label>
            <input 
              type="text"
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white font-mono text-center uppercase"
              value={confirmPlate}
              onChange={(e) => setConfirmPlate(e.target.value.toUpperCase())}
              placeholder={vehicle.plate}
              disabled={isDeleting}
            />
          </div>

          <button 
            onClick={handleConfirm}
            disabled={!isConfirmed || isDeleting}
            className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors ${
              isConfirmed 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isDeleting ? (
              'Eliminando...'
            ) : (
              <>
                <Trash2 className="w-5 h-5" />
                Eliminar Vehículo
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
