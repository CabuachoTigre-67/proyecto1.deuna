"use client";

import React from "react";

export default function JugadorDashboard() {
  return (
    <div className="space-y-6 text-slate-800">
      <header className="rounded-2xl bg-white p-6 shadow-md">
        <h1 className="text-2xl font-black text-slate-900">⚽ Panel del Jugador</h1>
        <p className="text-xs font-semibold text-slate-500">Reserva tu cancha y revisa tus próximos partidos.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800">Canchas Cercanas</h3>
          <p className="mt-2 text-xs text-slate-500">Explora la disponibilidad en Santa Cruz.</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800">Mis Reservas</h3>
          <p className="mt-2 text-xs text-slate-500">Consulta el estado de tus reservas activas.</p>
        </div>
      </div>
    </div>
  );
}