/**
 * LoadingSkeleton.jsx - Componente de carga percibida
 */

import React, { memo } from 'react';

const LoadingSkeleton = memo(() => (
  <section className="animate-fade-in-up bg-white rounded-[2rem] shadow-sm hover:shadow-md transition-shadow p-10 space-y-8">
    {/* Skeleton de imagen principal */}
    <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden bg-slate-200 animate-pulse"></div>
    
    {/* Layout Principal: Sidebar + Contenido */}
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Panel Lateral (Sidebar) - Widgets Skeleton */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-slate-200 rounded-[2rem] p-6 h-32 animate-pulse"></div>
        <div className="bg-slate-200 rounded-[2rem] p-6 h-24 animate-pulse"></div>
      </div>
      
      {/* Panel Central - Plan de Viaje Skeleton */}
      <div className="lg:col-span-3">
        <div className="bg-white rounded-[2rem] shadow-sm p-8 space-y-4">
          <div className="h-8 bg-slate-200 rounded animate-pulse w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
            <div className="h-4 bg-slate-200 rounded animate-pulse w-5/6"></div>
            <div className="h-4 bg-slate-200 rounded animate-pulse w-4/6"></div>
            <div className="h-4 bg-slate-200 rounded animate-pulse w-full"></div>
            <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4"></div>
          </div>
          <div className="space-y-3 mt-6">
            <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
            <div className="h-4 bg-slate-200 rounded animate-pulse w-5/6"></div>
            <div className="h-4 bg-slate-200 rounded animate-pulse w-4/6"></div>
          </div>
        </div>
      </div>
    </div>
  </section>
));

LoadingSkeleton.displayName = 'LoadingSkeleton';

export default LoadingSkeleton;

