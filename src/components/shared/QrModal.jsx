import { QRCodeCanvas } from 'qrcode.react';
import { X, Download, Copy, Check } from 'lucide-react';
import { useState, useRef } from 'react';

export default function QrModal({ vehicle, onClose }) {
  const [copied, setCopied] = useState(false);
  const qrRef = useRef(null);

  // Generar URL pública
  // Si existe una ruta específica de pasaporte, se puede ajustar aquí.
  // Por ahora usamos /marketplace con query param o una ruta directa si existiera.
  const qrUrl = `${window.location.origin}/marketplace?plate=${vehicle.plate}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const handleDownload = () => {
    const canvas = qrRef.current.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `autorah-qr-${vehicle.plate}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#151921] rounded-xl border border-gray-800 w-full max-w-sm p-6 relative flex flex-col items-center">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        
        <h2 className="text-xl font-bold mb-2 text-white">Código QR del Vehículo</h2>
        <p className="text-gray-400 text-sm mb-6 text-center">
          Escanea para ver el Pasaporte Digital de <br/>
          <span className="text-[#1E5EFF] font-bold">{vehicle.plate}</span>
        </p>
        
        <div className="bg-white p-4 rounded-xl mb-6" ref={qrRef}>
          <QRCodeCanvas 
            value={qrUrl} 
            size={200}
            level={"H"}
            includeMargin={true}
            imageSettings={{
              src: "/favicon.ico", // Opcional: logo en el centro si existe
              x: undefined,
              y: undefined,
              height: 24,
              width: 24,
              excavate: true,
            }}
          />
        </div>

        <div className="w-full space-y-3">
          <div className="flex items-center gap-2 bg-gray-900 p-3 rounded-lg border border-gray-700">
            <div className="flex-1 truncate text-xs text-gray-400 font-mono">
              {qrUrl}
            </div>
            <button 
              onClick={handleCopy}
              className="text-[#1E5EFF] hover:text-white transition-colors"
              title="Copiar enlace"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <button 
            onClick={handleDownload}
            className="w-full bg-[#1E5EFF] hover:bg-[#3C7BFF] py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors text-white"
          >
            <Download className="w-5 h-5" />
            Descargar QR PNG
          </button>
        </div>
      </div>
    </div>
  );
}
