import React, { useState } from 'react';
import { X, Search, CheckCircle, AlertTriangle, FileText, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { generateCertificatePDF } from '../../lib/pdfGenerator';
import { normalizePlate, normalizeVin, normalizeEngine } from '../../lib/normalization';

export default function CertifyVehicleModal({ isOpen, onClose, workshopProfile }) {
  const [step, setStep] = useState(1); // 1: Search, 2: Form, 3: Success
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [vehicle, setVehicle] = useState(null);
  const [error, setError] = useState(null);
  
  // Form Data
  const [certType, setCertType] = useState('basic');
  const [observations, setObservations] = useState('');
  const [checklist, setChecklist] = useState({
    motor: true,
    chasis: true,
    transmision: true,
    frenos: true,
    suspension: true,
    luces: true,
    neumaticos: true
  });

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);
    setVehicle(null);

    try {
      // Normalize search query
      const normalizedQuery = normalizePlate(searchQuery);

      // Search by normalized plate, VIN, or engine number using exact match
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .or(`plate.eq.${normalizedQuery},vin_full.eq.${normalizedQuery},engine_number_full.eq.${normalizedQuery}`)
        .limit(1)
        .single();

      if (error) throw error;
      if (!data) {
        setError('Vehículo no encontrado.');
      } else {
        // Validations
        if (data.status === 'stolen') {
          setError('⚠️ ALERTA: Este vehículo tiene reporte de robo. No se puede certificar.');
        } else {
          setVehicle(data);
          setStep(2);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Error al buscar el vehículo o no existe.');
    } finally {
      setLoading(false);
    }
  };

  const handleCertify = async () => {
    setLoading(true);
    try {
      const certificateId = crypto.randomUUID();
      const qrUrl = `${window.location.origin}/marketplace?plate=${vehicle.plate}`;
      
      // 1. Generate PDF
      const doc = await generateCertificatePDF(
        vehicle, 
        workshopProfile, 
        { id: certificateId, type: certType, checklist, observations },
        qrUrl
      );
      
      const pdfBlob = doc.output('blob');
      const fileName = `cert_${vehicle.plate}_${Date.now()}.pdf`;

      // 2. Upload PDF
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('certificates')
        .upload(fileName, pdfBlob);

      if (uploadError) throw uploadError;

      const pdfUrl = supabase.storage.from('certificates').getPublicUrl(fileName).data.publicUrl;

      // 3. Create Record
      const { error: dbError } = await supabase
        .from('vehicle_certificates')
        .insert({
          id: certificateId,
          vehicle_id: vehicle.id,
          issued_by_workshop_id: workshopProfile.id,
          certificate_type: certType,
          pdf_url: pdfUrl,
          qr_public_url: qrUrl,
          checklist: checklist,
          observations: observations,
          valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year validity
        });

      if (dbError) throw dbError;

      setStep(3);
    } catch (err) {
      console.error(err);
      setError('Error al generar el certificado: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(1);
    setSearchQuery('');
    setVehicle(null);
    setError(null);
    setObservations('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-blue-500/30 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-gray-800/50 p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-blue-400" />
            Certificar Vehículo
          </h2>
          <button onClick={reset} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* STEP 1: SEARCH */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <p className="text-gray-300">Busque el vehículo por Placa, VIN o Motor para iniciar la certificación.</p>
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ej: P123456, VIN..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                />
                <button 
                  onClick={handleSearch}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  Buscar
                </button>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: FORM */}
          {step === 2 && vehicle && (
            <div className="space-y-6">
              <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-white">{vehicle.brand} {vehicle.model} ({vehicle.year})</h3>
                  <p className="text-sm text-blue-300">Placa: {vehicle.plate} • VIN: {vehicle.vin || 'N/A'}</p>
                </div>
                <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/30">
                  VERIFICADO
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Tipo de Certificación</label>
                  <select 
                    value={certType}
                    onChange={(e) => setCertType(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="basic">Básica (Visual + Documental)</option>
                    <option value="full">Completa (Mecánica + Estructural)</option>
                    <option value="premium">Premium (Garantía Extendida)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Checklist de Inspección</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.keys(checklist).map((item) => (
                      <label key={item} className="flex items-center gap-2 text-gray-300 text-sm cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={checklist[item]}
                          onChange={(e) => setChecklist({...checklist, [item]: e.target.checked})}
                          className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
                        />
                        <span className="capitalize">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Observaciones del Taller</label>
                <textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white h-24 resize-none"
                  placeholder="Detalles sobre el estado del vehículo..."
                ></textarea>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleCertify}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors flex justify-center items-center gap-2"
                >
                  {loading ? <Loader className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                  Emitir Certificado
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 3 && (
            <div className="text-center space-y-6 py-8">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border border-green-500/50">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">¡Certificado Emitido!</h3>
                <p className="text-gray-400">El certificado ha sido generado y vinculado al vehículo exitosamente.</p>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg max-w-md mx-auto">
                <p className="text-blue-400 italic font-medium">"El pasaporte vive. El certificado deja constancia."</p>
              </div>

              <button 
                onClick={reset}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
              >
                Finalizar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}