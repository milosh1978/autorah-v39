import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { X, Wrench, AlertTriangle, FileText, History, Calendar, Plus, Trash2, Edit, FileDown, Eye, CheckCircle, BadgeCheck } from 'lucide-react';
import { generateStructuralChangePDF, generateVehiclePassportPDF } from '../../lib/pdfGenerator';

export default function VehicleDetailModal({ vehicle, onClose }) {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('maintenance');
  const [maintenance, setMaintenance] = useState([]);
  const [structuralChanges, setStructuralChanges] = useState([]);
  const [ownerNotes, setOwnerNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Detail Modal State
  const [selectedChange, setSelectedChange] = useState(null);
  
  // Form state for notes
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteForm, setNoteForm] = useState({ date: new Date().toISOString().split('T')[0], note_text: '' });
  const [editingNoteId, setEditingNoteId] = useState(null);

  const isOwner = user && vehicle.current_owner_id === user.id;
  const isWorkshop = profile?.role === 'taller';

  useEffect(() => {
    if (vehicle) fetchData();
  }, [vehicle]);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch Maintenance
      const { data: maintData } = await supabase
        .from('verified_maintenance')
        .select('*, workshop:users(full_name, workshop_details)')
        .eq('vehicle_id', vehicle.id)
        .order('date', { ascending: false });
      
      setMaintenance(maintData || []);

      // Fetch Structural Changes
      const { data: structData } = await supabase
        .from('structural_changes')
        .select('*, workshop:users(full_name, workshop_details)')
        .eq('vehicle_id', vehicle.id)
        .order('date', { ascending: false });
      
      setStructuralChanges(structData || []);

      // Fetch Owner Notes (Only if Owner or Workshop)
      if (isOwner || isWorkshop) {
        const { data: notesData } = await supabase
          .from('owner_notes')
          .select('*')
          .eq('vehicle_id', vehicle.id)
          .order('date', { ascending: false });
        setOwnerNotes(notesData || []);
      }
    } catch (error) {
      console.error('Error fetching details:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleGeneratePassport = (theme) => {
    generateVehiclePassportPDF(vehicle, maintenance, structuralChanges, null, theme);
  };

  const handleGenerateChangePDF = (change, theme) => {
    generateStructuralChangePDF(change, vehicle, change.workshop, theme);
  };

  // ... (rest of the existing functions: handleSaveNote, handleDeleteNote, startEditNote)

  async function handleSaveNote(e) {
    e.preventDefault();
    try {
      if (editingNoteId) {
        const { error } = await supabase
          .from('owner_notes')
          .update({
            date: noteForm.date,
            note_text: noteForm.note_text
          })
          .eq('id', editingNoteId)
          .eq('owner_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('owner_notes')
          .insert([{
            vehicle_id: vehicle.id,
            owner_id: user.id,
            date: noteForm.date,
            note_text: noteForm.note_text
          }]);
        if (error) throw error;
      }
      
      setShowNoteForm(false);
      setNoteForm({ date: new Date().toISOString().split('T')[0], note_text: '' });
      setEditingNoteId(null);
      fetchData();
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Error al guardar la nota');
    }
  }

  async function handleDeleteNote(id) {
    if (!confirm('¿Estás seguro de eliminar esta nota?')) return;
    try {
      const { error } = await supabase
        .from('owner_notes')
        .delete()
        .eq('id', id)
        .eq('owner_id', user.id);
      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  }

  function startEditNote(note) {
    setNoteForm({ date: note.date, note_text: note.note_text });
    setEditingNoteId(note.id);
    setShowNoteForm(true);
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#151921] rounded-xl border border-gray-800 w-full max-w-4xl h-[90vh] flex flex-col relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="p-6 border-b border-gray-800 bg-[#0B0E11]">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-white">{vehicle.brand} {vehicle.model} ({vehicle.year})</h2>
                {vehicle.isCertified && (
                  <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                    <BadgeCheck className="w-3 h-3" /> CERTIFICADO
                  </span>
                )}
              </div>
              <div className="flex gap-4 mt-2 text-sm text-gray-400">
                {(isOwner || isWorkshop) && (
                  <span className="bg-gray-800 px-2 py-1 rounded text-white">{vehicle.plate}</span>
                )}
                <span>VIN: <span className="font-mono text-gray-300">{vehicle.vin_full || vehicle.vin}</span></span>
              </div>
              
              {/* Marketplace Details */}
              {(vehicle.traction || vehicle.fuel_type || vehicle.location) && (
                <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-400">
                  {vehicle.traction && <span className="bg-gray-900 px-2 py-1 rounded border border-gray-700">Tracción: {vehicle.traction}</span>}
                  {vehicle.fuel_type && <span className="bg-gray-900 px-2 py-1 rounded border border-gray-700">Combustible: {vehicle.fuel_type}</span>}
                  {vehicle.engine_displacement && <span className="bg-gray-900 px-2 py-1 rounded border border-gray-700">Motor: {vehicle.engine_displacement}</span>}
                  {vehicle.general_condition && <span className="bg-gray-900 px-2 py-1 rounded border border-gray-700">Estado: {vehicle.general_condition}</span>}
                  {vehicle.location && <span className="bg-gray-900 px-2 py-1 rounded border border-gray-700">Ubicación: {vehicle.location}</span>}
                  {vehicle.odometer_not_working && <span className="bg-red-900/20 text-red-400 px-2 py-1 rounded border border-red-900/30">Odómetro no funciona</span>}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handleGeneratePassport('light')}
                className="bg-white text-black px-3 py-1.5 rounded text-xs font-bold hover:bg-gray-200 transition-colors flex items-center gap-1"
              >
                <FileDown size={14} /> Pasaporte (Claro)
              </button>
              <button 
                onClick={() => handleGeneratePassport('dark')}
                className="bg-gray-800 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-gray-700 transition-colors flex items-center gap-1"
              >
                <FileDown size={14} /> Pasaporte (Oscuro)
              </button>
            </div>
          </div>
          
          {(vehicle.marketplacePhotoUrl || vehicle.photo_url) && (
            <div className="h-48 w-full rounded-lg overflow-hidden bg-gray-900 mb-2">
              <img 
                src={vehicle.marketplacePhotoUrl || vehicle.photo_url} 
                alt={vehicle.model} 
                className="w-full h-full object-cover"
                onError={(e) => e.target.style.display = 'none'}
              />
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 bg-[#0B0E11] overflow-x-auto">
          <button 
            onClick={() => setActiveTab('maintenance')}
            className={`px-6 py-3 text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'maintenance' ? 'text-[#1E5EFF] border-b-2 border-[#1E5EFF]' : 'text-gray-400 hover:text-white'}`}
          >
            <Wrench className="w-4 h-4" />
            Mantenimientos
          </button>
          <button 
            onClick={() => setActiveTab('structural')}
            className={`px-6 py-3 text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'structural' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-400 hover:text-white'}`}
          >
            <AlertTriangle className="w-4 h-4" />
            Cambios Estructurales
          </button>
          {(isOwner || isWorkshop) && (
            <button 
              onClick={() => setActiveTab('notes')}
              className={`px-6 py-3 text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'notes' ? 'text-green-500 border-b-2 border-green-500' : 'text-gray-400 hover:text-white'}`}
            >
              <FileText className="w-4 h-4" />
              Notas del Propietario
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0B0E11]/50">
          {loading ? (
            <div className="flex justify-center py-12 text-gray-500">Cargando historial...</div>
          ) : (
            <>
              {/* Maintenance Tab */}
              {activeTab === 'maintenance' && (
                <div className="space-y-4">
                  {maintenance.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No hay mantenimientos registrados.</p>
                  ) : (
                    maintenance.map(item => (
                      <div key={item.id} className="bg-[#151921] border border-gray-800 p-4 rounded-lg hover:border-[#1E5EFF]/30 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-bold text-white text-lg">{item.service_type}</h4>
                            <p className="text-sm text-[#1E5EFF]">{item.workshop?.full_name || 'Taller Afiliado'}</p>
                          </div>
                          <span className="text-sm text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(item.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm mb-3">{item.description}</p>
                        <div className="flex gap-4 text-xs text-gray-500 border-t border-gray-800 pt-3">
                          <span>Km: {item.mileage}</span>
                          <span>Costo: ${item.cost}</span>
                          <span className="text-green-500 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            {item.verified_label}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Structural Changes Tab */}
              {activeTab === 'structural' && (
                <div className="space-y-4">
                  {structuralChanges.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No hay cambios estructurales registrados.</p>
                  ) : (
                    structuralChanges.map(item => (
                      <div key={item.id} className="bg-[#151921] border border-orange-900/30 p-4 rounded-lg hover:border-orange-500/30 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-bold text-white text-lg capitalize">{item.type}</h4>
                            <p className="text-sm text-orange-500">{item.workshop?.full_name || 'Taller Afiliado'}</p>
                          </div>
                          <span className="text-sm text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(item.date).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{item.description}</p>
                        
                        <div className="flex justify-between items-center border-t border-gray-800 pt-3">
                          <div className="text-xs text-gray-500">
                            {item.odo_not_working ? (
                              <span className="text-red-400">Odómetro no funciona</span>
                            ) : (
                              <span>Km: {item.km}</span>
                            )}
                          </div>
                          <button 
                            onClick={() => setSelectedChange(item)}
                            className="text-orange-500 text-xs hover:text-orange-400 flex items-center gap-1"
                          >
                            <Eye size={14} /> Ver Detalle
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Owner Notes Tab */}
              {activeTab === 'notes' && (isOwner || isWorkshop) && (
                <div className="space-y-6">
                  {isOwner && (
                    <div className="flex justify-end">
                      <button 
                        onClick={() => {
                          setNoteForm({ date: new Date().toISOString().split('T')[0], note_text: '' });
                          setEditingNoteId(null);
                          setShowNoteForm(true);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Agregar Nota
                      </button>
                    </div>
                  )}

                  {showNoteForm && (
                    <div className="bg-[#1A1F29] p-4 rounded-lg border border-gray-700 animate-in fade-in slide-in-from-top-4">
                      <h3 className="text-white font-bold mb-4">{editingNoteId ? 'Editar Nota' : 'Nueva Nota'}</h3>
                      <form onSubmit={handleSaveNote} className="space-y-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Fecha</label>
                          <input 
                            type="date" 
                            required
                            value={noteForm.date}
                            onChange={e => setNoteForm({...noteForm, date: e.target.value})}
                            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-green-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Nota</label>
                          <textarea 
                            required
                            rows="3"
                            value={noteForm.note_text}
                            onChange={e => setNoteForm({...noteForm, note_text: e.target.value})}
                            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-green-500 focus:outline-none"
                            placeholder="Escribe tu nota aquí..."
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <button 
                            type="button"
                            onClick={() => setShowNoteForm(false)}
                            className="px-4 py-2 text-gray-400 hover:text-white"
                          >
                            Cancelar
                          </button>
                          <button 
                            type="submit"
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                          >
                            Guardar
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="space-y-4">
                    {ownerNotes.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No hay notas registradas.</p>
                    ) : (
                      ownerNotes.map(note => (
                        <div key={note.id} className="bg-[#151921] border border-gray-800 p-4 rounded-lg hover:border-green-500/30 transition-colors relative group">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-sm text-green-500 font-medium flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(note.date).toLocaleDateString()}
                            </span>
                            {isOwner && (
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => startEditNote(note)}
                                  className="p-1 text-gray-400 hover:text-white"
                                  title="Editar"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="p-1 text-gray-400 hover:text-red-500"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                          <p className="text-gray-300 text-sm whitespace-pre-wrap">{note.note_text}</p>
                          <div className="mt-3 pt-3 border-t border-gray-800 text-xs text-gray-600 italic">
                            {note.seal}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Structural Change Detail Modal */}
        {selectedChange && (
          <div className="absolute inset-0 bg-black/95 z-50 flex flex-col p-6 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
              <h3 className="text-xl font-bold text-white">Detalle del Cambio Estructural</h3>
              <button onClick={() => setSelectedChange(null)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-900 p-3 rounded">
                  <span className="block text-gray-500">Tipo</span>
                  <span className="text-white font-medium">{selectedChange.type}</span>
                </div>
                <div className="bg-gray-900 p-3 rounded">
                  <span className="block text-gray-500">Fecha</span>
                  <span className="text-white font-medium">{new Date(selectedChange.date).toLocaleDateString()}</span>
                </div>
                <div className="bg-gray-900 p-3 rounded">
                  <span className="block text-gray-500">Kilometraje</span>
                  <span className="text-white font-medium">
                    {selectedChange.odo_not_working ? 'Odómetro no funciona' : `${selectedChange.km} km`}
                  </span>
                </div>
                <div className="bg-gray-900 p-3 rounded">
                  <span className="block text-gray-500">Taller</span>
                  <span className="text-white font-medium">{selectedChange.workshop?.full_name}</span>
                </div>
              </div>

              <div>
                <h4 className="text-gray-400 text-sm mb-2">Descripción Completa</h4>
                <div className="bg-gray-900 p-4 rounded text-gray-300 whitespace-pre-wrap">
                  {selectedChange.description}
                </div>
              </div>

              {selectedChange.photos && selectedChange.photos.length > 0 && (
                <div>
                  <h4 className="text-gray-400 text-sm mb-2">Evidencia Fotográfica</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedChange.photos.map((photo, idx) => (
                      <div key={idx} className="aspect-video bg-gray-800 rounded overflow-hidden border border-gray-700">
                        <img 
                          src={photo} 
                          alt={`Evidencia ${idx + 1}`} 
                          className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                          onClick={() => window.open(photo, '_blank')}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-800 flex justify-end gap-3">
              <button 
                onClick={() => handleGenerateChangePDF(selectedChange, 'light')}
                className="bg-white text-black px-4 py-2 rounded font-bold hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <FileDown size={16} /> PDF (Claro)
              </button>
              <button 
                onClick={() => handleGenerateChangePDF(selectedChange, 'dark')}
                className="bg-gray-800 text-white px-4 py-2 rounded font-bold hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <FileDown size={16} /> PDF (Oscuro)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}