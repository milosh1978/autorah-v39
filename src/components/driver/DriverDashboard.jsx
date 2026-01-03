import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { uploadImageToCloudinary } from '../../lib/cloudinary';
import VehicleCard from '../shared/VehicleCard';
import VehicleDetailModal from '../shared/VehicleDetailModal';
import QrModal from '../shared/QrModal';
import Notifications from '../shared/Notifications';
import { countries } from '../../lib/countries';
import { normalizePlate, normalizeVin, normalizeEngine } from '../../lib/normalization';
import ConflictModal from '../shared/ConflictModal';
import ClaimModal from '../shared/ClaimModal';
import DeleteVehicleModal from '../shared/DeleteVehicleModal';
import DeleteAccountModal from '../shared/DeleteAccountModal';
import { Plus, Loader, X, Upload, Image as ImageIcon, Settings } from 'lucide-react';

export default function DriverDashboard() {
  const { user, signOut } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedQrVehicle, setSelectedQrVehicle] = useState(null);
  const [showSellModal, setShowSellModal] = useState(false);
  const [detailVehicle, setDetailVehicle] = useState(null);
  
  // Delete states
  const [showDeleteVehicleModal, setShowDeleteVehicleModal] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  
  // Anti-duplicate states
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [conflictData, setConflictData] = useState(null);
  const [conflictVehicleId, setConflictVehicleId] = useState(null);

  const [sellData, setSellData] = useState({ 
    price: '', 
    description: '', 
    photo_url: '',
    traction: '4x2',
    fuel_type: 'Gasolina',
    engine_displacement: '',
    owner_count: '1',
    general_condition: 'Bueno',
    country: 'El Salvador',
    city: '',
    odometer_not_working: false
  });
  const [newVehicle, setNewVehicle] = useState({
    plate: '',
    vin_full: '',
    engine_number_full: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    photo_url: ''
  });

  useEffect(() => {
    if (user) fetchVehicles();
  }, [user]);

  async function fetchVehicles() {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('current_owner_id', user.id)
        .eq('is_deleted', false);
      
      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleImageUpload(e, isEditing = false) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const url = await uploadImageToCloudinary(file);
      
      if (isEditing) {
        setEditingVehicle(prev => ({ ...prev, photo_url: url }));
      } else {
        setNewVehicle(prev => ({ ...prev, photo_url: url }));
      }
    } catch (error) {
      alert('Error uploading image: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSellImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const url = await uploadImageToCloudinary(file);
      setSellData(prev => ({ ...prev, photo_url: url }));
    } catch (error) {
      alert('Error uploading image for selling: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleAddVehicle(e) {
    e.preventDefault();
    try {
      // 1. Normalize inputs
      const normPlate = normalizePlate(newVehicle.plate);
      const normVin = normalizeVin(newVehicle.vin_full);
      const normEngine = normalizeEngine(newVehicle.engine_number_full);

      // 2. Check for duplicates
      const { data: existingVehicles, error: searchError } = await supabase
        .from('vehicles')
        .select('id, plate, vin_full, engine_number_full')
        .or(`plate.eq.${normPlate},vin_full.eq.${normVin},engine_number_full.eq.${normEngine}`);

      if (searchError) throw searchError;

      if (existingVehicles && existingVehicles.length > 0) {
        // Duplicate found!
        const conflict = existingVehicles[0];
        setConflictData({
          plate: conflict.plate,
          vin: conflict.vin_full,
          engine: conflict.engine_number_full
        });
        setConflictVehicleId(conflict.id);
        setShowAddModal(false);
        setShowConflictModal(true);
        return; // Stop creation
      }

      // 3. Create vehicle if no duplicates
      const { error } = await supabase.from('vehicles').insert({
        ...newVehicle,
        plate: normPlate, // Save normalized
        vin_full: normVin, // Save normalized
        engine_number_full: normEngine, // Save normalized
        current_owner_id: user.id
      });

      if (error) throw error;
      
      setShowAddModal(false);
      fetchVehicles();
      setNewVehicle({
        plate: '',
        vin_full: '',
        engine_number_full: '',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        color: '',
        photo_url: ''
      });
    } catch (error) {
      alert('Error adding vehicle: ' + error.message);
    }
  }

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [transferEmail, setTransferEmail] = useState('');
  const [transferType, setTransferType] = useState('email'); // 'email' or 'deposit'

  const handleAction = (action, vehicle) => {
    if (action === 'qr') {
      setSelectedQrVehicle(vehicle);
      setShowQrModal(true);
    } else if (action === 'edit') {
      setEditingVehicle(vehicle);
      setShowEditModal(true);
    } else if (action === 'transfer') {
      setSelectedVehicle(vehicle);
      setShowTransferModal(true);
    } else if (action === 'sell') {
      setSelectedVehicle(vehicle);
      setShowSellModal(true);
    } else if (action === 'view') {
      setDetailVehicle(vehicle);
      setShowDetailModal(true);
    } else if (action === 'delete') {
      setVehicleToDelete(vehicle);
      setShowDeleteVehicleModal(true);
    }
  };

  async function handleDeleteVehicle() {
    if (!vehicleToDelete) return;
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ 
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: user.id
        })
        .eq('id', vehicleToDelete.id);

      if (error) throw error;

      // Also remove from marketplace if listed
      await supabase
        .from('marketplace')
        .delete()
        .eq('vehicle_id', vehicleToDelete.id);

      setShowDeleteVehicleModal(false);
      setVehicleToDelete(null);
      fetchVehicles();
      alert('Vehículo eliminado correctamente.');
    } catch (error) {
      alert('Error al eliminar vehículo: ' + error.message);
    }
  }

  async function handleDeleteAccount(password) {
    try {
      // 1. Re-authenticate
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password
      });

      if (authError) {
        alert('Contraseña incorrecta. No se pudo verificar tu identidad.');
        return;
      }

      // 2. Soft delete user profile
      const { error: profileError } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 3. Unlist all vehicles from marketplace
      // First get all user vehicles
      const { data: userVehicles } = await supabase
        .from('vehicles')
        .select('id')
        .eq('current_owner_id', user.id);

      if (userVehicles && userVehicles.length > 0) {
        const vehicleIds = userVehicles.map(v => v.id);
        await supabase
          .from('marketplace')
          .delete()
          .in('vehicle_id', vehicleIds);
      }

      // 4. Sign out
      await signOut();
      window.location.href = '/';
      
    } catch (error) {
      alert('Error al eliminar cuenta: ' + error.message);
    }
  }

  async function handleEditVehicle(e) {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({
          plate: editingVehicle.plate,
          vin_full: editingVehicle.vin_full,
          engine_number_full: editingVehicle.engine_number_full,
          brand: editingVehicle.brand,
          model: editingVehicle.model,
          year: editingVehicle.year,
          color: editingVehicle.color,
          photo_url: editingVehicle.photo_url
        })
        .eq('id', editingVehicle.id);

      if (error) throw error;
      
      setShowEditModal(false);
      fetchVehicles();
      setEditingVehicle(null);
    } catch (error) {
      alert('Error updating vehicle: ' + error.message);
    }
  }

  async function handleSell(e) {
    e.preventDefault();
    if (!selectedVehicle) return;

    try {
      // Combinar País y Ciudad en un solo string para el campo location
      const locationString = `${sellData.country} - ${sellData.city}`;

      const { error } = await supabase.from('marketplace').insert({
        vehicle_id: selectedVehicle.id,
        price: sellData.price,
        description: sellData.description,
        photo_url: sellData.photo_url,
        traction: sellData.traction,
        fuel_type: sellData.fuel_type,
        engine_displacement: sellData.engine_displacement,
        owner_count: sellData.owner_count,
        general_condition: sellData.general_condition,
        location: locationString, // Guardado combinado como solicitado
        odometer_not_working: sellData.odometer_not_working,
        status: 'available'
      });

      if (error) throw error;

      alert('Vehículo publicado en Marketplace exitosamente.');
      setShowSellModal(false);
      setSellData({ 
        price: '', 
        description: '', 
        photo_url: '',
        traction: '4x2',
        fuel_type: 'Gasolina',
        engine_displacement: '',
        owner_count: '1',
        general_condition: 'Bueno',
        country: 'El Salvador',
        city: '',
        odometer_not_working: false
      });
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }

  async function handleTransfer(e) {
    e.preventDefault();
    if (!selectedVehicle) return;

    try {
      let newOwnerId = null;

      if (transferType === 'email') {
        // Find user by email
        const { data: users, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('email', transferEmail)
          .single();
        
        if (userError || !users) {
          alert('Usuario no encontrado con ese correo.');
          return;
        }
        newOwnerId = users.id;
      }

      // Update vehicle
      const { error: updateError } = await supabase
        .from('vehicles')
        .update({
          current_owner_id: newOwnerId,
          status: transferType === 'deposit' ? 'unregistered_deposit' : 'active'
        })
        .eq('id', selectedVehicle.id);

      if (updateError) throw updateError;

      // Create transfer record
      await supabase.from('transfers').insert({
        vehicle_id: selectedVehicle.id,
        from_owner_id: user.id,
        to_owner_id: newOwnerId,
        reason: transferType === 'deposit' ? 'Enviado a Depósito Digital' : 'Transferencia directa'
      });

      // Notification for Deposit
      if (transferType === 'deposit') {
        await supabase.from('notifications').insert({
          user_id: user.id,
          message: `Has enviado tu vehículo ${selectedVehicle.plate} al Depósito Digital.`,
          type: 'deposito'
        });
      }

      alert('Transferencia realizada exitosamente.');
      setShowTransferModal(false);
      setTransferEmail('');
      fetchVehicles();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }

  if (loading) return <div className="flex justify-center p-12"><Loader className="animate-spin text-white" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 text-white">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Mis Vehículos</h1>
        <div className="flex items-center gap-4">
          <Notifications />
          <button 
            onClick={() => setShowDeleteAccountModal(true)}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            title="Configuración / Eliminar Cuenta"
          >
            <Settings className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-[#1E5EFF] hover:bg-[#3C7BFF] px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Registrar Vehículo
          </button>
        </div>
      </div>

      {vehicles.length === 0 ? (
        <div className="text-center py-12 bg-[#151921] rounded-xl border border-gray-800">
          <p className="text-gray-400 mb-4">No tienes vehículos registrados.</p>
          <button 
            onClick={() => setShowAddModal(true)}
            className="text-[#1E5EFF] hover:underline"
          >
            Registra tu primer auto ahora
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map(vehicle => (
            <VehicleCard 
              key={vehicle.id} 
              vehicle={vehicle} 
              isOwner={true} 
              onAction={handleAction}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && detailVehicle && (
        <VehicleDetailModal 
          vehicle={detailVehicle} 
          onClose={() => setShowDetailModal(false)} 
        />
      )}

      {/* QR Modal */}
      {showQrModal && selectedQrVehicle && (
        <QrModal 
          vehicle={selectedQrVehicle} 
          onClose={() => setShowQrModal(false)} 
        />
      )}

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#151921] rounded-xl border border-gray-800 w-full max-w-lg p-6 relative">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="text-2xl font-bold mb-6">Registrar Nuevo Vehículo</h2>
            
            <form onSubmit={handleAddVehicle} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Placa</label>
                  <input 
                    required
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                    value={newVehicle.plate}
                    onChange={e => setNewVehicle({...newVehicle, plate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Año</label>
                  <input 
                    type="number"
                    required
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                    value={newVehicle.year}
                    onChange={e => setNewVehicle({...newVehicle, year: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Marca</label>
                  <input 
                    required
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                    value={newVehicle.brand}
                    onChange={e => setNewVehicle({...newVehicle, brand: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Modelo</label>
                  <input 
                    required
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                    value={newVehicle.model}
                    onChange={e => setNewVehicle({...newVehicle, model: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">VIN (Número de Chasis)</label>
                <input 
                  required
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white font-mono"
                  value={newVehicle.vin_full}
                  onChange={e => setNewVehicle({...newVehicle, vin_full: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Número de Motor</label>
                <input 
                  required
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white font-mono"
                  value={newVehicle.engine_number_full}
                  onChange={e => setNewVehicle({...newVehicle, engine_number_full: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Color</label>
                <input 
                  required
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                  value={newVehicle.color}
                  onChange={e => setNewVehicle({...newVehicle, color: e.target.value})}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Foto del Vehículo</label>
                <div className="space-y-3">
                  {newVehicle.photo_url && (
                    <div className="relative w-full h-48 bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
                      <img 
                        src={newVehicle.photo_url} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setNewVehicle({...newVehicle, photo_url: ''})}
                        className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <label className="flex-1 cursor-pointer bg-gray-900 border border-gray-700 hover:border-[#1E5EFF] rounded-lg p-3 flex items-center justify-center gap-2 transition-colors group">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleImageUpload(e, false)}
                        disabled={isUploading}
                      />
                      {isUploading ? (
                        <Loader className="w-5 h-5 animate-spin text-[#1E5EFF]" />
                      ) : (
                        <Upload className="w-5 h-5 text-gray-400 group-hover:text-[#1E5EFF]" />
                      )}
                      <span className="text-sm text-gray-400 group-hover:text-white">
                        {isUploading ? 'Subiendo...' : 'Subir foto desde dispositivo'}
                      </span>
                    </label>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-800"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-[#151921] px-2 text-gray-500">O pega una URL</span>
                    </div>
                  </div>

                  <input 
                    type="url"
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-sm"
                    value={newVehicle.photo_url}
                    onChange={e => setNewVehicle({...newVehicle, photo_url: e.target.value})}
                    placeholder="https://ejemplo.com/mi-auto.jpg"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-[#1E5EFF] hover:bg-[#3C7BFF] py-3 rounded-lg font-bold mt-4 transition-colors"
              >
                Guardar Vehículo
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Vehicle Modal */}
      {showEditModal && editingVehicle && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#151921] rounded-xl border border-gray-800 w-full max-w-lg p-6 relative">
            <button 
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="text-2xl font-bold mb-6">Editar Vehículo</h2>
            
            <form onSubmit={handleEditVehicle} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Placa</label>
                  <input 
                    required
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                    value={editingVehicle.plate}
                    onChange={e => setEditingVehicle({...editingVehicle, plate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Año</label>
                  <input 
                    type="number"
                    required
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                    value={editingVehicle.year}
                    onChange={e => setEditingVehicle({...editingVehicle, year: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Marca</label>
                  <input 
                    required
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                    value={editingVehicle.brand}
                    onChange={e => setEditingVehicle({...editingVehicle, brand: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Modelo</label>
                  <input 
                    required
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                    value={editingVehicle.model}
                    onChange={e => setEditingVehicle({...editingVehicle, model: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">VIN (Número de Chasis)</label>
                <input 
                  required
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white font-mono"
                  value={editingVehicle.vin_full}
                  onChange={e => setEditingVehicle({...editingVehicle, vin_full: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Número de Motor</label>
                <input 
                  required
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white font-mono"
                  value={editingVehicle.engine_number_full}
                  onChange={e => setEditingVehicle({...editingVehicle, engine_number_full: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Color</label>
                <input 
                  required
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                  value={editingVehicle.color}
                  onChange={e => setEditingVehicle({...editingVehicle, color: e.target.value})}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Foto del Vehículo</label>
                <div className="space-y-3">
                  {editingVehicle.photo_url && (
                    <div className="relative w-full h-48 bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
                      <img 
                        src={editingVehicle.photo_url} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setEditingVehicle({...editingVehicle, photo_url: ''})}
                        className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <label className="flex-1 cursor-pointer bg-gray-900 border border-gray-700 hover:border-[#1E5EFF] rounded-lg p-3 flex items-center justify-center gap-2 transition-colors group">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleImageUpload(e, true)}
                        disabled={isUploading}
                      />
                      {isUploading ? (
                        <Loader className="w-5 h-5 animate-spin text-[#1E5EFF]" />
                      ) : (
                        <Upload className="w-5 h-5 text-gray-400 group-hover:text-[#1E5EFF]" />
                      )}
                      <span className="text-sm text-gray-400 group-hover:text-white">
                        {isUploading ? 'Subiendo...' : 'Cambiar foto desde dispositivo'}
                      </span>
                    </label>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-800"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-[#151921] px-2 text-gray-500">O pega una URL</span>
                    </div>
                  </div>

                  <input 
                    type="url"
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-sm"
                    value={editingVehicle.photo_url || ''}
                    onChange={e => setEditingVehicle({...editingVehicle, photo_url: e.target.value})}
                    placeholder="https://ejemplo.com/mi-auto.jpg"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-[#1E5EFF] hover:bg-[#3C7BFF] py-3 rounded-lg font-bold mt-4 transition-colors"
              >
                Guardar Cambios
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Sell Modal */}
      {showSellModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#151921] rounded-xl border border-gray-800 w-full max-w-md p-6 relative">
            <button 
              onClick={() => setShowSellModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="text-2xl font-bold mb-6">Vender Vehículo</h2>
            <p className="text-gray-400 mb-4">
              Publicar <span className="text-white font-bold">{selectedVehicle?.plate}</span> en el Marketplace.
            </p>
            
            <form onSubmit={handleSell} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Precio (USD)</label>
                  <input 
                    type="number"
                    required
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                    value={sellData.price}
                    onChange={e => setSellData({...sellData, price: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">País</label>
                  <select 
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                    value={sellData.country}
                    onChange={e => setSellData({...sellData, country: e.target.value})}
                  >
                    {countries.map(c => (
                      <option key={c.code} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Ciudad</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ej: San Salvador"
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                    value={sellData.city}
                    onChange={e => setSellData({...sellData, city: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Tracción</label>
                  <select 
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                    value={sellData.traction}
                    onChange={e => setSellData({...sellData, traction: e.target.value})}
                  >
                    <option value="4x2">4x2</option>
                    <option value="4x4">4x4</option>
                    <option value="AWD">AWD</option>
                    <option value="FWD">FWD</option>
                    <option value="RWD">RWD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Combustible</label>
                  <select 
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                    value={sellData.fuel_type}
                    onChange={e => setSellData({...sellData, fuel_type: e.target.value})}
                  >
                    <option value="Gasolina">Gasolina</option>
                    <option value="Diésel">Diésel</option>
                    <option value="Gas">Gas</option>
                    <option value="Híbrido">Híbrido</option>
                    <option value="Eléctrico">Eléctrico</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Motor (CC/L)</label>
                  <input 
                    type="text"
                    placeholder="Ej: 2.0L o 2000cc"
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                    value={sellData.engine_displacement}
                    onChange={e => setSellData({...sellData, engine_displacement: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Dueños</label>
                  <input 
                    type="number"
                    min="1"
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                    value={sellData.owner_count}
                    onChange={e => setSellData({...sellData, owner_count: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Estado General</label>
                  <select 
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                    value={sellData.general_condition}
                    onChange={e => setSellData({...sellData, general_condition: e.target.value})}
                  >
                    <option value="Excelente">Excelente</option>
                    <option value="Bueno">Bueno</option>
                    <option value="Regular">Regular</option>
                    <option value="Para reparar">Para reparar</option>
                  </select>
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-[#1E5EFF]"
                      checked={sellData.odometer_not_working}
                      onChange={e => setSellData({...sellData, odometer_not_working: e.target.checked})}
                    />
                    <span className="text-sm text-gray-400">Odómetro no funciona</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Descripción</label>
                <textarea 
                  required
                  rows="3"
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                  value={sellData.description}
                  onChange={e => setSellData({...sellData, description: e.target.value})}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Foto del Vehículo (Opcional)</label>
                <div className="space-y-3">
                  {sellData.photo_url && (
                    <div className="relative w-full h-48 bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
                      <img
                        src={sellData.photo_url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setSellData({...sellData, photo_url: ''})}
                        className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <label className="flex-1 cursor-pointer bg-gray-900 border border-gray-700 hover:border-[#1E5EFF] rounded-lg p-3 flex items-center justify-center gap-2 transition-colors group">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleSellImageUpload}
                        disabled={isUploading}
                      />
                      {isUploading ? (
                        <Loader className="w-5 h-5 animate-spin text-[#1E5EFF]" />
                      ) : (
                        <Upload className="w-5 h-5 text-gray-400 group-hover:text-[#1E5EFF]" />
                      )}
                      <span className="text-sm text-gray-400 group-hover:text-white">
                        {isUploading ? 'Subiendo...' : 'Subir foto desde dispositivo'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-[#1E5EFF] hover:bg-[#3C7BFF] py-3 rounded-lg font-bold mt-4 transition-colors"
              >
                Publicar en Marketplace
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#151921] rounded-xl border border-gray-800 w-full max-w-md p-6 relative">
            <button 
              onClick={() => setShowTransferModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="text-2xl font-bold mb-6">Transferir Vehículo</h2>
            <p className="text-gray-400 mb-4">
              Estás a punto de transferir la propiedad de: <span className="text-white font-bold">{selectedVehicle?.plate}</span>
            </p>
            
            <form onSubmit={handleTransfer} className="space-y-4">
              <div className="flex gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => setTransferType('email')}
                  className={`flex-1 py-2 rounded border ${transferType === 'email' ? 'bg-[#1E5EFF]/20 border-[#1E5EFF] text-[#1E5EFF]' : 'border-gray-700 text-gray-400'}`}
                >
                  A Usuario
                </button>
                <button
                  type="button"
                  onClick={() => setTransferType('deposit')}
                  className={`flex-1 py-2 rounded border ${transferType === 'deposit' ? 'bg-[#1E5EFF]/20 border-[#1E5EFF] text-[#1E5EFF]' : 'border-gray-700 text-gray-400'}`}
                >
                  A Depósito
                </button>
              </div>

              {transferType === 'email' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Correo del Nuevo Dueño</label>
                  <input 
                    type="email"
                    required
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                    value={transferEmail}
                    onChange={e => setTransferEmail(e.target.value)}
                    placeholder="usuario@ejemplo.com"
                  />
                </div>
              )}

              {transferType === 'deposit' && (
                <div className="bg-yellow-500/10 border border-yellow-500/50 p-3 rounded text-sm text-yellow-200">
                  El vehículo quedará en el "Limbo" hasta que alguien lo reclame usando el VIN y Placa.
                </div>
              )}

              <button 
                type="submit"
                className="w-full bg-[#1E5EFF] hover:bg-[#3C7BFF] py-3 rounded-lg font-bold mt-4 transition-colors"
              >
                Confirmar Transferencia
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Anti-Duplicate Modals */}
      <ConflictModal 
        isOpen={showConflictModal}
        onClose={() => setShowConflictModal(false)}
        onClaim={() => {
          setShowConflictModal(false);
          setShowClaimModal(true);
        }}
        onViewPublic={() => {
          // Redirect to marketplace or show public detail
          // For now, just close and alert (or implement navigation)
          window.location.href = `/marketplace?plate=${conflictData?.plate}`;
        }}
        vehicleData={conflictData}
      />

      <ClaimModal 
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        vehicleId={conflictVehicleId}
        vehicleData={conflictData}
      />

      {/* Delete Modals */}
      <DeleteVehicleModal 
        isOpen={showDeleteVehicleModal}
        onClose={() => setShowDeleteVehicleModal(false)}
        onConfirm={handleDeleteVehicle}
        vehicle={vehicleToDelete}
      />

      <DeleteAccountModal 
        isOpen={showDeleteAccountModal}
        onClose={() => setShowDeleteAccountModal(false)}
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
}
