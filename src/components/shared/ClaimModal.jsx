import React, { useState } from 'react';
import { ShieldCheck, Upload, X, Loader, AlertCircle } from 'lucide-react';
import { uploadImageToCloudinary } from '../../lib/cloudinary';
import { supabase } from '../../lib/supabase';

export default function ClaimModal({ isOpen, onClose, vehicleId, vehicleData }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [cardFile, setCardFile] = useState(null);
  const [vinFile, setVinFile] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cardFile || !vinFile) {
      setError('Debes subir ambas fotos para procesar el reclamo.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Upload images
      const cardUrl = await uploadImageToCloudinary(cardFile);
      const vinUrl = await uploadImageToCloudinary(vinFile);

      // 2. Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // 3. Create claim
      const { error: claimError } = await supabase
        .from('vehicle_claims')
        .insert({
          vehicle_id: vehicleId,
          claimant_user_id: user.id,
          status: 'pending',
          evidence_urls: [cardUrl, vinUrl]
        });

      if (claimError) throw claimError;

      setSuccess(true);
    } catch (err) {
      console.error('Error creating claim:', err);
      setError('Error al enviar el reclamo. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center animate-in fade-in zoom-in duration-200">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Reclamo Enviado!</h3>
          <p className="text-gray-600 mb-6">
            Hemos recibido tu solicitud y evidencia. Un administrador revisará el caso y te notificaremos pronto. El vehículo ha sido marcado como "En Disputa".
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gray-50 p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Reclamar Propiedad</h3>
            <p className="text-sm text-gray-500">Sube evidencia para demostrar que eres el dueño.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
            <p className="text-sm text-blue-800">
              Estás reclamando el vehículo: <span className="font-bold">{vehicleData?.plate}</span>.
              Necesitamos verificar tu identidad y propiedad.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Card Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                1. Foto de Tarjeta de Circulación
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:bg-gray-50 transition-colors text-center cursor-pointer relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCardFile(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-2">
                  {cardFile ? (
                    <>
                      <ShieldCheck className="w-8 h-8 text-green-500" />
                      <span className="text-sm font-medium text-green-600">{cardFile.name}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400" />
                      <span className="text-sm text-gray-500">Toca para subir foto</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* VIN/Engine Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                2. Foto del VIN o Número de Motor
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:bg-gray-50 transition-colors text-center cursor-pointer relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setVinFile(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-2">
                  {vinFile ? (
                    <>
                      <ShieldCheck className="w-8 h-8 text-green-500" />
                      <span className="text-sm font-medium text-green-600">{vinFile.name}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400" />
                      <span className="text-sm text-gray-500">Toca para subir foto</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting || !cardFile || !vinFile}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    Enviar Reclamo
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
