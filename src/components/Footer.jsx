import { Car } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0B0E11] border-t border-gray-800 text-gray-400 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <div className="w-8 h-8 bg-[#1E5EFF] rounded-lg flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-white tracking-wider">AUTORAH</span>
          </div>
          
          <div className="flex gap-6 text-sm">
            <a href="#" className="hover:text-white transition-colors">Términos</a>
            <a href="#" className="hover:text-white transition-colors">Privacidad</a>
            <a href="#" className="hover:text-white transition-colors">Contacto</a>
          </div>
          
          <div className="mt-4 md:mt-0 text-sm">
            © {new Date().getFullYear()} AUTORAH. El Pasaporte Global del Vehículo.
          </div>
        </div>
        
        {/* Simulated Ad Banner in Footer */}
        <div className="mt-8 p-4 bg-gray-900 rounded-lg border border-gray-800 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Publicidad</p>
          <p className="text-white font-medium">Aceites Premium X - El mejor cuidado para tu motor. ¡Encuéntranos en talleres afiliados!</p>
        </div>
      </div>
    </footer>
  );
}
