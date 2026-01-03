import { Link } from 'react-router-dom';
import { Car, ShieldCheck, RefreshCw, QrCode, Search, Wrench } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="bg-[#0B0E11] text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center relative z-10">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              AUTORAH
              <span className="block text-[#1E5EFF] mt-2">El Pasaporte Global del Vehículo®</span>
            </h1>
            <p className="mt-4 text-xl text-gray-400 max-w-3xl mx-auto">
              Un sistema universal que registra la vida mecánica de cada auto. 
              Gratis para usuarios y talleres. Historial verificable, transferible y seguro.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="px-8 py-4 bg-[#1E5EFF] hover:bg-[#3C7BFF] rounded-lg font-bold text-lg transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2">
                <Car className="w-5 h-5" />
                Soy Conductor
              </Link>
              <Link to="/register" className="px-8 py-4 bg-[#151921] border border-gray-700 hover:border-[#1E5EFF] rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2">
                <Wrench className="w-5 h-5" />
                Soy Taller
              </Link>
              <Link to="/marketplace" className="px-8 py-4 bg-transparent border border-gray-700 hover:bg-gray-800 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2">
                <Search className="w-5 h-5" />
                Ver Marketplace
              </Link>
            </div>
          </div>
          
          {/* Background Elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#1E5EFF]/10 rounded-full blur-3xl -z-0 pointer-events-none"></div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-24 bg-[#0F1216]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<ShieldCheck className="w-8 h-8 text-[#1E5EFF]" />}
              title="Historial Universal"
              description="Cada mantenimiento queda registrado para siempre. Verifica el estado real de cualquier vehículo antes de comprar."
            />
            <FeatureCard 
              icon={<RefreshCw className="w-8 h-8 text-[#1E5EFF]" />}
              title="Transferencia Digital"
              description="Transfiere el historial completo al nuevo dueño con un clic. Si no tiene cuenta, el auto queda en Depósito Digital."
            />
            <FeatureCard 
              icon={<QrCode className="w-8 h-8 text-[#1E5EFF]" />}
              title="QR Único"
              description="Cada vehículo tiene una identidad digital única. Escanea para ver su estado, historial público y validaciones."
            />
          </div>
        </div>
      </div>

      {/* Value Props */}
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Para Conductores</h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-[#1E5EFF]/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-[#1E5EFF]"></div>
                  </div>
                  <p className="text-gray-300">Valoriza tu vehículo con un historial transparente.</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-[#1E5EFF]/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-[#1E5EFF]"></div>
                  </div>
                  <p className="text-gray-300">Recibe alertas de mantenimiento y ofertas exclusivas.</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-[#1E5EFF]/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-[#1E5EFF]"></div>
                  </div>
                  <p className="text-gray-300">Vende más rápido en nuestro Marketplace certificado.</p>
                </li>
              </ul>
            </div>
            <div className="bg-[#151921] p-8 rounded-xl border border-gray-800">
              <h3 className="text-xl font-bold mb-4 text-[#A8B0BA]">Depósito Digital</h3>
              <p className="text-gray-400 mb-6">
                ¿Vendiste tu auto a alguien que no usa AUTORAH? No hay problema. 
                El vehículo queda en el "Limbo" seguro hasta que el nuevo dueño lo reclame con el VIN.
              </p>
              <Link to="/deposit" className="text-[#1E5EFF] font-medium hover:underline">
                Explorar Depósito Digital →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Ad Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-8 text-center border border-gray-700">
          <p className="text-sm text-gray-500 uppercase tracking-widest mb-2">Publicidad</p>
          <h3 className="text-2xl font-bold text-white mb-2">Talleres Certificados en tu Ciudad</h3>
          <p className="text-gray-400">Encuentra los mejores especialistas para tu marca con garantía AUTORAH.</p>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-[#151921] p-8 rounded-xl border border-gray-800 hover:border-[#1E5EFF]/50 transition-colors">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}
