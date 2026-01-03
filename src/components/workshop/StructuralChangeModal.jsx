import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Plus, Trash2, AlertCircle } from 'lucide-react';

export default function StructuralChangeModal({ vehicle, onClose, onSave }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    type: 'Cambio de motor',
    date: new Date().toISOString().split('T')[0],
    km: '',
    odo_not_working: false,
    description: '',
    photos: [''] // Start with one empty input
  });

  const CHANGE_TYPES = [
    "Cambio de motor",
    "Cambio de transmisión",
    "Reparación de chasis",
    "Conversión 4x4",
    "Reparación estructural mayor",
    "Cambio de color",
    "Otro"
  ];

  const handlePhotoChange = (index, value) => {
    const newPhotos = [...formData.photos];
    newPhotos[index] = value;
    setFormData({ ...formData, photos: newPhotos });
  };

  const addPhotoField = () => {
    if (formData.photos.length < 6) {
      setFormData({ ...formData, photos: [...formData.photos, ''] });
    }
  };

  const removePhotoField = (index) => {
    const newPhotos = formData.photos.filter((_, i) => i !== index);
    setFormData({ ...formData, photos: newPhotos });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation: At least one valid photo URL
    const validPhotos = formData.photos.filter(p => p.trim() !== '');
    if (validPhotos.length === 0) {
      setError("Debes agregar al menos una URL de foto válida como evidencia.");
      setLoading(false);
      return;
    }

    if (!formData.odo_not_working && !formData.km) {
      setError("Debes ingresar el kilometraje o marcar 'Odómetro no funciona'.");
      setLoading(false);
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      
      const { error: insertError } = await supabase
        .from('structural_changes')
        .insert([{
          vehicle_id: vehicle.id,
          workshop_id: user.id,
          type: formData.type,
          date: formData.date,
          km: formData.odo_not_working ? null : formData.km,
          odo_not_working: formData.odo_not_working,
          description: formData.description,
          photos: validPhotos
        }]);

      if (insertError) throw insertError;

      onSave();
      onClose();
    } catch (err) {
      console.error('Error saving structural change:', err);
      setError('Error al guardar el cambio estructural. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center sticky top-0 bg-gray-900 z-10">
          <h2 className="text-xl font-bold text-white">Registrar Cambio Estructural</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg flex items-center gap-2">
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Tipo de Cambio</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {CHANGE_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Fecha</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Kilometraje</label>
              <input
                type="number"
                value={formData.km}
                onChange={(e) => setFormData({...formData, km: e.target.value})}
                disabled={formData.odo_not_working}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
                placeholder="Ej: 150000"
              />
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.odo_not_working}
                  onChange={(e) => setFormData({...formData, odo_not_working: e.target.checked})}
                  className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                />
                Odómetro no funciona
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Descripción Detallada</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none h-32"
              placeholder="Describe los detalles técnicos del cambio realizado..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Evidencia Fotográfica (URLs) - Mínimo 1 obligatoria
            </label>
            <div className="space-y-3">
              {formData.photos.map((photo, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="url"
                    value={photo}
                    onChange={(e) => handlePhotoChange(index, e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="https://ejemplo.com/foto.jpg"
                  />
                  {formData.photos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePhotoField(index)}
                      className="p-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {formData.photos.length < 6 && (
              <button
                type="button"
                onClick={addPhotoField}
                className="mt-3 flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                <Plus size={16} /> Agregar otra foto
              </button>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? 'Guardando...' : 'Registrar Cambio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
