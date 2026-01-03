import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { Search, Plus, Loader, CheckCircle, BadgeCheck } from 'lucide-react';
import StructuralChangeModal from './StructuralChangeModal';
import CertifyVehicleModal from './CertifyVehicleModal';

export default function WorkshopDashboard() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [foundVehicle, setFoundVehicle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recentServices, setRecentServices] = useState([]);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showStructuralModal, setShowStructuralModal] = useState(false);
  const [showCertificationModal, setShowCertificationModal] = useState(false);
  
  // Maintenance Form State
  const [serviceData, setServiceData] = useState({
    mileage: '',
    service_type: 'Mantenimiento General',
    description: '',
    cost: '',
    next_maintenance_date: ''
  });

  // Structural Change Form State - REMOVED (Now handled by StructuralChangeModal)

  // Pre-fill previous engine number when vehicle is found or modal opens - REMOVED (Handled in component)

  useEffect(() => {
    if (user) fetchRecentServices();
  }, [user]);

  async function fetchRecentServices() {
    const { data } = await supabase
      .from('verified_maintenance')
      .select('*, vehicles(plate, brand, model)')
      .eq('workshop_id', user.id)
      .order('date', { ascending: false })
      .limit(5);
    
    if (data) setRecentServices(data);
  }

  async function handleSearch(e) {
    e.preventDefault();
    setLoading(true);
    setFoundVehicle(null);
    
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .or(`plate.eq.${searchTerm},vin_full.eq.${searchTerm}`)
        .single();
      
      if (data) {
        setFoundVehicle(data);
      } else {
        alert('Vehículo no encontrado');
      }
    } catch (err) {
      console.error(err);
      alert('Error en la búsqueda');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddMaintenance(e) {
    e.preventDefault();
    if (!foundVehicle) return;

    try {
      const { error } = await supabase.from('verified_maintenance').insert({
        vehicle_id: foundVehicle.id,
        workshop_id: user.id,
        ...serviceData
      });

      if (error) throw error;

      // Notify Owner
      if (foundVehicle.current_owner_id) {
        await supabase.from('notifications').insert({
          user_id: foundVehicle.current_owner_id,
          message: `Nuevo mantenimiento registrado para tu vehículo ${foundVehicle.plate} por ${user.user_metadata?.full_name || 'Taller'}.`,
          type: 'mantenimiento'
        });
      }

      alert('Mantenimiento registrado exitosamente');
      setShowMaintenanceModal(false);
      setServiceData({
        mileage: '',
        service_type: 'Mantenimiento General',
        description: '',
        cost: '',
        next_maintenance_date: ''
      });
      fetchRecentServices();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }

  // handleAddStructuralChange REMOVED - Handled by component

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 text-white">
      <h1 className="text-3xl font-bold mb-8">Panel de Taller</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Search Section */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[#151921] p-6 rounded-xl border border-gray-800">
            <h2 className="text-xl font-bold mb-4">Buscar Vehículo</h2>
            <form onSubmit={handleSearch} className="flex gap-4">
              <input 
                type="text" 
                placeholder="Ingresa Placa o VIN"
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-[#1E5EFF] outline-none"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <button 
                type="submit"
                disabled={loading}
                className="bg-[#1E5EFF] hover:bg-[#3C7BFF] px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {loading ? <Loader className="animate-spin w-5 h-5" /> : <Search className="w-5 h-5" />}
                Buscar
              </button>
            </form>
          </div>

          {/* Found Vehicle Result */}
          {foundVehicle && (
            <div className="bg-[#151921] p-6 rounded-xl border border-gray-800 border-l-4 border-l-[#1E5EFF]">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold">{foundVehicle.brand} {foundVehicle.model} ({foundVehicle.year})</h3>
                  <p className="text-gray-400 text-lg mt-1">Placa: {foundVehicle.plate}</p>
                  <div className="mt-4 space-y-1 text-sm text-gray-500">
                    <p>VIN: <span className="font-mono text-gray-300">{foundVehicle.vin_full}</span></p>
                    <p>Motor: <span className="font-mono text-gray-300">{foundVehicle.engine_number_full}</span></p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowStructuralModal(true)}
                      className="bg-orange-600 hover:bg-orange-500 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      Cambio Estructural
                    </button>
                    <button 
                      onClick={() => setShowMaintenanceModal(true)}
                      className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      Agregar Servicio
                    </button>
                  </div>
                  <button 
                    onClick={() => setShowCertificationModal(true)}
                    className="bg-yellow-600 hover:bg-yellow-500 px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors w-full"
                  >
                    <BadgeCheck className="w-5 h-5" />
                    Certificar Vehículo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Services Sidebar */}
        <div className="bg-[#151921] p-6 rounded-xl border border-gray-800 h-fit">
          <h2 className="text-xl font-bold mb-4">Servicios Recientes</h2>
          <div className="space-y-4">
            {recentServices.length === 0 ? (
              <p className="text-gray-500 text-sm">No hay servicios recientes.</p>
            ) : (
              recentServices.map(service => (
                <div key={service.id} className="border-b border-gray-800 pb-3 last:border-0">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-white">{service.vehicles?.plate}</span>
                    <span className="text-xs text-gray-500">{new Date(service.date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-[#1E5EFF]">{service.service_type}</p>
                  <p className="text-xs text-gray-400 truncate">{service.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Maintenance Modal */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#151921] rounded-xl border border-gray-800 w-full max-w-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Registrar Mantenimiento</h2>
            <form onSubmit={handleAddMaintenance} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Kilometraje</label>
                  <input 
                    type="number"
                    required
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                    value={serviceData.mileage}
                    onChange={e => setServiceData({...serviceData, mileage: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Costo</label>
                  <input 
                    type="number"
                    required
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                    value={serviceData.cost}
                    onChange={e => setServiceData({...serviceData, cost: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Tipo de Servicio</label>
                <select 
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                  value={serviceData.service_type}
                  onChange={e => setServiceData({...serviceData, service_type: e.target.value})}
                >
                  <option>Mantenimiento General</option>
                  <option>Cambio de Aceite</option>
                  <option>Frenos</option>
                  <option>Suspensión</option>
                  <option>Motor</option>
                  <option>Transmisión</option>
                  <option>Llantas</option>
                  <option>Eléctrico</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Descripción Detallada</label>
                <textarea 
                  required
                  rows="3"
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                  value={serviceData.description}
                  onChange={e => setServiceData({...serviceData, description: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Próximo Mantenimiento (Opcional)</label>
                <input 
                  type="date"
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                  value={serviceData.next_maintenance_date}
                  onChange={e => setServiceData({...serviceData, next_maintenance_date: e.target.value})}
                />
              </div>

              <div className="flex gap-4 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowMaintenanceModal(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 py-3 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-[#1E5EFF] hover:bg-[#3C7BFF] py-3 rounded-lg font-bold transition-colors"
                >
                  Guardar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Structural Change Modal */}
      {showStructuralModal && (
        <StructuralChangeModal 
          vehicle={foundVehicle} 
          onClose={() => setShowStructuralModal(false)} 
          onSuccess={() => {
            setShowStructuralModal(false);
            // Refresh vehicle data if needed
            handleSearch({ preventDefault: () => {} });
          }}
        />
      )}

      {/* Certification Modal */}
      {showCertificationModal && (
        <CertifyVehicleModal 
          isOpen={showCertificationModal}
          onClose={() => setShowCertificationModal(false)} 
          workshopProfile={user}
        />
      )}
    </div>
  );
}
