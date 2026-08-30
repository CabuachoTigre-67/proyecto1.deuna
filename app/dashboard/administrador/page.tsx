    "use client";

import React from "react";

export default function AdministradorDashboard() {
  return (
    <div className="space-y-6 text-slate-800">
      <header className="rounded-2xl bg-slate-900 text-white p-6 shadow-md">
        <h1 className="text-2xl font-black">⚙️ Panel de Administración General</h1>
        <p className="text-xs font-medium text-slate-400">Control global del sistema, métricas y usuarios.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
          <p className="text-xs font-bold text-slate-400">Total Usuarios</p>
          <p className="text-2xl font-black text-slate-800">128</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
          <p className="text-xs font-bold text-slate-400">Canchas Habilitadas</p>
          <p className="text-2xl font-black text-emerald-600">14</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
          <p className="text-xs font-bold text-slate-400">Ingresos Totales</p>
          <p className="text-2xl font-black text-slate-800">Bs. 4,500</p>
        </div>
      </div>
    </div>
  );
}