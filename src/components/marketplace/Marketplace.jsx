import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { countries } from '../../lib/countries';
import VehicleCard from '../shared/VehicleCard';
import VehicleDetailModal from '../shared/VehicleDetailModal';
import { Search, Filter, Loader, BadgeCheck, MapPin } from 'lucide-react';

export default function Marketplace() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    brand: '',
    minPrice: '',
    maxPrice: '',
    certifiedOnly: false,
    country: '',
    city: ''
  });
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showProfileAlert, setShowProfileAlert] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    fetchListings();
  }, []);

  const handleNearMe = async () => {
    setLocating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Logged in user logic
        const { data: profile } = await supabase
          .from('users')
          .select('country, city')
          .eq('id', user.id)
          .single();

        if (profile && profile.country && profile.city) {
          setFilters(prev => ({
            ...prev,
            country: profile.country,
            city: profile.city
          }));
        } else {
          setShowProfileAlert(true);
        }
      } else {
        // Guest logic - Geolocation
        if (!navigator.geolocation) {
          alert('Tu navegador no soporta geolocalización.');
          return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            // Free reverse geocoding (OpenStreetMap)
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await response.json();
            
            if (data && data.address) {
              const detectedCountry = data.address.country;
              const detectedCity = data.address.city || data.address.town || data.address.village || data.address.county;
              
              setFilters(prev => ({
                ...prev,
                country: detectedCountry || '',
                city: detectedCity || ''
              }));
            }
          } catch (err) {
            console.error('Error geolocating:', err);
            alert('No pudimos detectar tu ubicación automáticamente.');
          }
        }, (err) => {
          console.error('Geolocation permission denied:', err);
          // Fallback or just do nothing (user denied)
        });
      }
    } catch (error) {
      console.error('Error in Near Me:', error);
    } finally {
      setLocating(false);
    }
  };

  async function fetchListings() {
    try {
      let query = supabase
        .from('marketplace')
        .select(`
          *,
          vehicles!inner(
            *,
            structural_changes(*),
            owner_notes(count),
            verified_maintenance(count),
            vehicle_certifications(*)
          )
        `)
        .eq('status', 'available')
        .eq('vehicles.is_deleted', false);

      const { data, error } = await query;
      
      if (error) throw error;

      const processedListings = data.map(item => {
        const structuralChanges = item.vehicles.structural_changes || [];
        const structuralChangesCount = structuralChanges.length;
        const hasEngineChange = structuralChanges.some(change => change.change_type === 'motor');
        const ownerNotesCount = item.vehicles.owner_notes?.[0]?.count || 0;
        const maintenanceCount = item.vehicles.verified_maintenance?.[0]?.count || 0;
        const certifications = item.vehicles.vehicle_certifications || [];
        
        // Certification Logic: Has at least one certification AND at least one verified maintenance
        const isCertified = certifications.length > 0 && maintenanceCount > 0;

        return {
          ...item,
          vehicles: {
            ...item.vehicles,
            structuralChangesCount,
            hasEngineChange,
            ownerNotesCount,
            marketplacePhotoUrl: item.photo_url || item.vehicles.photo_url,
            // Merge marketplace fields into vehicle object for display
            traction: item.traction,
            fuel_type: item.fuel_type,
            engine_displacement: item.engine_displacement,
            owner_count: item.owner_count,
            general_condition: item.general_condition,
            location: item.location,
            country: item.country,
            city: item.city,
            odometer_not_working: item.odometer_not_working,
            isCertified // Add certified flag
          }
        };
      });
      setListings(processedListings || []);
    } catch (error) {
      console.error('Error fetching marketplace:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredListings = listings.filter(item => {
    if (filters.brand && !item.vehicles.brand.toLowerCase().includes(filters.brand.toLowerCase())) return false;
    if (filters.minPrice && item.price < Number(filters.minPrice)) return false;
    if (filters.maxPrice && item.price > Number(filters.maxPrice)) return false;
    if (filters.certifiedOnly && !item.vehicles.isCertified) return false;

    // Country Filter
    if (filters.country) {
      const countryMatch = (item.vehicles.country && item.vehicles.country.toLowerCase() === filters.country.toLowerCase()) ||
                           (item.vehicles.location && item.vehicles.location.toLowerCase().includes(filters.country.toLowerCase()));
      if (!countryMatch) return false;
    }

    // City Filter
    if (filters.city) {
      const searchCity = filters.city.trim().toLowerCase();
      const cityMatch = (item.vehicles.city && item.vehicles.city.toLowerCase().includes(searchCity)) ||
                        (item.vehicles.location && item.vehicles.location.toLowerCase().includes(searchCity));
      if (!cityMatch) return false;
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 text-white">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Marketplace Certificado</h1>
          <p className="text-gray-400">Vehículos con historial verificado por AUTORAH.</p>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-2 bg-[#151921] p-2 rounded-lg border border-gray-800 items-center">
          <button
            onClick={handleNearMe}
            disabled={locating}
            className={`flex items-center gap-1 px-3 py-1 rounded text-sm font-medium transition-colors ${
              filters.country || filters.city ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
            title="Usar mi ubicación"
          >
            {locating ? <Loader className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
            <span className="hidden sm:inline">Cerca de mí</span>
          </button>

          <select
            className="bg-gray-900 border border-gray-700 rounded px-3 py-1 text-sm text-white w-32"
            value={filters.country}
            onChange={e => setFilters({...filters, country: e.target.value})}
          >
            <option value="">País...</option>
            {countries.map(c => (
              <option key={c.code} value={c.name}>{c.name}</option>
            ))}
          </select>

          <input 
            placeholder="Ciudad..." 
            className="bg-gray-900 border border-gray-700 rounded px-3 py-1 text-sm text-white w-32"
            value={filters.city}
            onChange={e => setFilters({...filters, city: e.target.value})}
          />

          <input 
            placeholder="Marca..." 
            className="bg-gray-900 border border-gray-700 rounded px-3 py-1 text-sm text-white w-32"
            value={filters.brand}
            onChange={e => setFilters({...filters, brand: e.target.value})}
          />
          <input 
            placeholder="Min $" 
            type="number"
            className="bg-gray-900 border border-gray-700 rounded px-3 py-1 text-sm text-white w-24"
            value={filters.minPrice}
            onChange={e => setFilters({...filters, minPrice: e.target.value})}
          />
          <input 
            placeholder="Max $" 
            type="number"
            className="bg-gray-900 border border-gray-700 rounded px-3 py-1 text-sm text-white w-24"
            value={filters.maxPrice}
            onChange={e => setFilters({...filters, maxPrice: e.target.value})}
          />
          
          <label className="flex items-center gap-1 px-2 cursor-pointer select-none">
            <input 
              type="checkbox"
              className="rounded border-gray-700 bg-gray-900 text-[#1E5EFF]"
              checked={filters.certifiedOnly}
              onChange={e => setFilters({...filters, certifiedOnly: e.target.checked})}
            />
            <span className="text-sm text-yellow-400 font-bold flex items-center gap-1">
              <BadgeCheck className="w-4 h-4" /> Certificados
            </span>
          </label>

          <button className="bg-[#1E5EFF] p-2 rounded hover:bg-[#3C7BFF]">
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader className="animate-spin text-white" /></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map(item => (
            <div key={item.id} className="relative group">
              <VehicleCard 
                vehicle={item.vehicles} 
                isOwner={false} 
                onAction={() => setSelectedVehicle(item.vehicles)}
              />
              <div className="absolute top-4 left-4 bg-[#1E5EFF] text-white px-3 py-1 rounded-full font-bold shadow-lg z-10">
                ${item.price.toLocaleString()}
              </div>
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button 
                  onClick={() => setSelectedVehicle(item.vehicles)}
                  className="bg-white text-black px-4 py-2 rounded-lg font-bold hover:bg-gray-200 shadow-lg"
                >
                  Ver Detalles
                </button>
              </div>
            </div>
          ))}
          
          {filteredListings.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              No se encontraron vehículos disponibles.
            </div>
          )}
        </div>
      )}

      {selectedVehicle && (
        <VehicleDetailModal 
          vehicle={selectedVehicle} 
          onClose={() => setSelectedVehicle(null)} 
        />
      )}

      {showProfileAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Completa tu perfil</h3>
            <p className="text-gray-600 mb-4 text-sm">
              Para usar "Cerca de mí", necesitamos saber tu país y ciudad. Por favor actualiza tu perfil.
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowProfileAlert(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
              >
                Cancelar
              </button>
              {/* In a real app, this would link to profile settings */}
              <button 
                onClick={() => setShowProfileAlert(false)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
