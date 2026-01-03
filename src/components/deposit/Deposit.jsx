import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import VehicleCard from '../shared/VehicleCard';
import { Loader, AlertTriangle } from 'lucide-react';

export default function Deposit() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDepositVehicles();
  }, []);

  async function fetchDepositVehicles() {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('status', 'unregistered_deposit');
      
      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error fetching deposit:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleClaim(vehicle) {
    if (!user) {
      alert('Debes iniciar sesión para reclamar un vehículo.');
      return;
    }

    const confirmClaim = window.confirm(`¿Estás seguro de que quieres reclamar el vehículo ${vehicle.plate}?`);
    if (!confirmClaim) return;

    try {
      // Update vehicle owner and status
      const { error } = await supabase
        .from('vehicles')
        .update({ 
          current_owner_id: user.id,
          status: 'active'
        })
        .eq('id', vehicle.id);

      if (error) throw error;

      // Create transfer record
      await supabase.from('transfers').insert({
        vehicle_id: vehicle.id,
        to_owner_id: user.id,
        reason: 'Reclamación desde Depósito Digital'
      });

      // Notify New Owner (Claimer)
      await supabase.from('notifications').insert({
        user_id: user.id,
        message: `Has reclamado exitosamente el vehículo ${vehicle.plate} del Depósito Digital.`,
        type: 'transferencia'
      });

      alert('Vehículo reclamado exitosamente. Ahora aparecerá en tu panel.');
      fetchDepositVehicles();
    } catch (err) {
      alert('Error al reclamar: ' + err.message);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 text-white">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Depósito Digital</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Vehículos que han sido transferidos a usuarios sin cuenta o que están esperando ser reclamados.
          Si reconoces tu vehículo aquí, puedes reclamarlo para continuar su historial.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader className="animate-spin text-white" /></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map(vehicle => (
            <div key={vehicle.id} className="relative">
              <VehicleCard 
                vehicle={vehicle} 
                isOwner={false} 
                onAction={() => {}}
              />
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-xl">
                <button 
                  onClick={() => handleClaim(vehicle)}
                  className="bg-[#1E5EFF] hover:bg-[#3C7BFF] px-6 py-3 rounded-lg font-bold text-white shadow-lg transform hover:scale-105 transition-all"
                >
                  Reclamar Vehículo
                </button>
              </div>
              <div className="absolute top-2 left-2 bg-yellow-500/20 border border-yellow-500 text-yellow-500 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                En Depósito
              </div>
            </div>
          ))}

          {vehicles.length === 0 && (
            <div className="col-span-full text-center py-12 bg-[#151921] rounded-xl border border-gray-800">
              <p className="text-gray-400">No hay vehículos en el depósito digital actualmente.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
