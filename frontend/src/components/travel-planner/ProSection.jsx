/**
 * ProSection.jsx - Sección promocional de ViajeIA PRO
 */

import React, { memo } from 'react';
import { Hotel, BellRing, WifiOff, Headset } from 'lucide-react';
import { toast } from 'sonner';

const ProSection = memo(() => {
  return (
    <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[32px] p-8 border border-white/10 shadow-2xl relative overflow-hidden">
      {/* Decorative glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-yellow-500/5 pointer-events-none blur-3xl"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="flex flex-col items-center text-center mb-8 relative z-10">
        <div className="text-6xl mb-4 drop-shadow-lg">👑</div>
        <h3 className="font-semibold text-2xl mb-2">
          <span className="text-white">ViajeIA </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500">PRO</span>
        </h3>
        <p className="text-slate-300 text-sm">Experiencia de viaje premium</p>
      </div>
      
      <div className="mb-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
              <Hotel className="w-5 h-5 text-yellow-400" />
            </div>
            <span className="text-slate-100 text-sm">Reservas directas</span>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
              <BellRing className="w-5 h-5 text-yellow-400" />
            </div>
            <span className="text-slate-100 text-sm">Alertas</span>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
              <WifiOff className="w-5 h-5 text-yellow-400" />
            </div>
            <span className="text-slate-100 text-sm">Guías offline</span>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
              <Headset className="w-5 h-5 text-yellow-400" />
            </div>
            <span className="text-slate-100 text-sm">Asistente 24/7</span>
          </div>
        </div>
      </div>
      
      <button
        type="button"
        onClick={() => {
          toast.success('¡Gracias por tu interés! Te notificaremos cuando ViajeIA PRO esté disponible. 🎉');
        }}
        className="w-full px-6 py-4 bg-white text-slate-900 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 font-semibold rounded-full transition-all duration-200 flex items-center justify-center gap-2 shadow-lg relative z-10"
      >
        <span>Unirse a la lista de espera</span>
        <span className="text-lg">→</span>
      </button>
    </section>
  );
});

ProSection.displayName = 'ProSection';

export default ProSection;

