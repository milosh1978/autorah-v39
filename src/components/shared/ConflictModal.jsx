import React from 'react';
import { AlertTriangle, FileText, ShieldAlert, X } from 'lucide-react';

export default function ConflictModal({ isOpen, onClose, onClaim, onViewPublic, vehicleData }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-amber-50 p-6 border-b border-amber-100 flex items-start gap-4">
          <div className="bg-amber-100 p-3 rounded-full shrink-0">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Vehículo ya registrado</h3>
            <p className="text-sm text-gray-600 mt-1">
              Detectamos que este vehículo ya existe en la base de datos de AUTORAH.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm">
            <p className="font-medium text-gray-700 mb-2">Datos coincidentes:</p>
            <ul className="space-y-1 text-gray-600">
              {vehicleData?.plate && <li>• Placa: <span className="font-mono font-bold">{vehicleData.plate}</span></li>}
              {vehicleData?.vin && <li>• VIN: <span className="font-mono font-bold">{vehicleData.vin}</span></li>}
              {vehicleData?.engine && <li>• Motor: <span className="font-mono font-bold">{vehicleData.engine}</span></li>}
            </ul>
          </div>

          <p className="text-sm text-gray-600">
            Por seguridad, no se pueden crear duplicados. Si eres el dueño legítimo, puedes iniciar un proceso de reclamo.
          </p>
        </div>

        {/* Actions */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-col gap-3">
          <button
            onClick={onViewPublic}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
          >
            <FileText className="w-5 h-5" />
            Ver Ficha Pública
          </button>
          
          <button
            onClick={onClaim}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-amber-500 text-amber-700 hover:bg-amber-50 rounded-xl font-medium transition-colors"
          >
            <ShieldAlert className="w-5 h-5" />
            Reclamar como mío
          </button>

          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-gray-500 hover:text-gray-700 font-medium transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
