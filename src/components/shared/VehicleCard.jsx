import { Car, QrCode, ArrowRightLeft, DollarSign, Edit, BadgeCheck, MapPin, Fuel, Gauge, Trash2 } from 'lucide-react';

export default function VehicleCard({ vehicle, isOwner = false, onAction }) {
  const { structuralChangesCount, hasEngineChange, ownerNotesCount, isCertified } = vehicle;
  const displayPhoto = vehicle.photo_url || vehicle.marketplacePhotoUrl;

  return (
    <div className="bg-[#151921] rounded-xl border border-gray-800 overflow-hidden hover:border-[#1E5EFF]/50 transition-all h-full flex flex-col">
      {/* Image */}
      <div className="h-48 bg-gray-800 relative shrink-0">
        {displayPhoto ? (
          <img 
            src={displayPhoto} 
            alt={vehicle.model} 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null; 
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex'; // Show fallback
            }}
          />
        ) : null}
        
        <div className={`w-full h-full flex items-center justify-center text-gray-600 ${displayPhoto ? 'hidden' : ''}`}>
          <Car className="w-12 h-12" />
        </div>
        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur px-2 py-1 rounded text-xs font-bold text-white border border-gray-700 z-10">
          {vehicle.year}
        </div>
        
        {/* Certified Badge */}
        {isCertified && (
          <div className="absolute bottom-2 left-2 bg-yellow-500/90 backdrop-blur px-2 py-1 rounded text-xs font-bold text-black flex items-center gap-1 shadow-lg z-10">
            <BadgeCheck className="w-4 h-4" />
            CERTIFICADO
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <div onClick={() => onAction('view', vehicle)} className="cursor-pointer hover:opacity-80 transition-opacity">
          <h3 className="text-lg font-bold text-white">{vehicle.brand} {vehicle.model}</h3>
          {isOwner && <p className="text-gray-400 text-sm mb-4">{vehicle.plate}</p>}
          {!isOwner && <div className="mb-4"></div>}
        </div>

        <div className="space-y-2 text-sm text-gray-500 mb-4">
          <div className="flex justify-between">
            <span>VIN:</span>
            <span className="font-mono text-gray-300">
              {isOwner ? vehicle.vin_full : `****${vehicle.vin_full?.slice(-4) || '****'}`}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Motor:</span>
            <span className="font-mono text-gray-300">
              {isOwner ? vehicle.engine_number_full : `****${vehicle.engine_number_full?.slice(-4) || '****'}`}
            </span>
          </div>
        </div>

        {/* Marketplace Extra Fields */}
        {(vehicle.traction || vehicle.fuel_type || vehicle.location || (vehicle.city && vehicle.country)) && (
          <div className="grid grid-cols-2 gap-2 mb-4 text-xs text-gray-400">
            {vehicle.traction && (
              <div className="bg-gray-900 p-1.5 rounded flex items-center gap-1">
                <Gauge className="w-3 h-3" /> {vehicle.traction}
              </div>
            )}
            {vehicle.fuel_type && (
              <div className="bg-gray-900 p-1.5 rounded flex items-center gap-1">
                <Fuel className="w-3 h-3" /> {vehicle.fuel_type}
              </div>
            )}
            {(vehicle.location || (vehicle.city && vehicle.country)) && (
              <div className="col-span-2 bg-gray-900 p-1.5 rounded flex items-center gap-1">
                <MapPin className="w-3 h-3" /> 
                {vehicle.city && vehicle.country ? `${vehicle.city}, ${vehicle.country}` : vehicle.location}
              </div>
            )}
            {vehicle.odometer_not_working && (
              <div className="col-span-2 bg-red-900/20 text-red-400 p-1.5 rounded flex items-center gap-1 border border-red-900/30">
                <Gauge className="w-3 h-3" /> Odómetro no funciona
              </div>
            )}
          </div>
        )}

        {/* Structural Changes Summary */}
        {structuralChangesCount > 0 && (
          <div className="mt-auto p-3 bg-gray-900 rounded-lg text-xs text-gray-400 border border-gray-700 mb-2">
            <p>Este vehículo tiene {structuralChangesCount} cambio(s) estructural(es) registrado(s) por talleres afiliados.</p>
            {hasEngineChange && (
              <p className="mt-1 text-yellow-400 font-semibold">Motor reemplazado y registrado en AUTORAH.</p>
            )}
          </div>
        )}

        {/* Owner Notes Summary */}
        {ownerNotesCount > 0 && (
          <div className="mt-2 p-3 bg-gray-900 rounded-lg text-xs text-gray-400 border border-gray-700">
            <p>Este vehículo tiene {ownerNotesCount} nota(s) privada(s) registrada(s) por su propietario.</p>
          </div>
        )}

        {/* Actions */}
        {isOwner && (
          <div className="mt-4 grid grid-cols-5 gap-2">
            <button 
              onClick={() => onAction('edit', vehicle)}
              className="flex flex-col items-center justify-center p-2 bg-gray-800 rounded hover:bg-gray-700 transition-colors text-xs gap-1"
            >
              <Edit className="w-4 h-4 text-blue-400" />
              <span>Editar</span>
            </button>
            <button 
              onClick={() => onAction('qr', vehicle)}
              className="flex flex-col items-center justify-center p-2 bg-gray-800 rounded hover:bg-gray-700 transition-colors text-xs gap-1"
            >
              <QrCode className="w-4 h-4 text-[#1E5EFF]" />
              <span>QR</span>
            </button>
            <button 
              onClick={() => onAction('transfer', vehicle)}
              className="flex flex-col items-center justify-center p-2 bg-gray-800 rounded hover:bg-gray-700 transition-colors text-xs gap-1"
            >
              <ArrowRightLeft className="w-4 h-4 text-green-500" />
              <span>Transferir</span>
            </button>
            <button 
              onClick={() => onAction('sell', vehicle)}
              className="flex flex-col items-center justify-center p-2 bg-gray-800 rounded hover:bg-gray-700 transition-colors text-xs gap-1"
            >
              <DollarSign className="w-4 h-4 text-yellow-500" />
              <span>Vender</span>
            </button>
            <button 
              onClick={() => onAction('delete', vehicle)}
              className="flex flex-col items-center justify-center p-2 bg-gray-800 rounded hover:bg-red-900/30 transition-colors text-xs gap-1 group"
            >
              <Trash2 className="w-4 h-4 text-red-500 group-hover:text-red-400" />
              <span className="text-red-500 group-hover:text-red-400">Eliminar</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
