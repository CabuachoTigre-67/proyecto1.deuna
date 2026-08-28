"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function MisReservasPage() {
  // Lista de reservas de ejemplo
  const [reservas] = useState([
    {
      id: "1",
      cancha: "Cancha El Río - Campo A",
      ubicacion: "Equipetrol, Santa Cruz",
      fecha: "Sábado, 16 de Octubre",
      hora: "19:00 - 20:00",
      precio: 150,
      estado: "Confirmada",
    },
    {
      id: "2",
      cancha: "Complejo Sur - Cancha 3",
      ubicacion: "Zona Sur, Santa Cruz",
      fecha: "Miércoles, 20 de Octubre",
      hora: "21:00 - 22:00",
      precio: 120,
      estado: "Pendiente",
    },
  ]);

  return (
    <div className="min-h-screen bg-slate-100/60 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Encabezado y Navegación */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/dashboard"
              className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1 mb-2"
            >
              ← Volver al Dashboard
            </Link>
            <h1 className="text-2xl font-black text-slate-800">
              Mis Reservas 📅
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Administra tus partidos programados y verifica el estado de tus canchas.
            </p>
          </div>

          <Link
            href="/dashboard/projects/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm"
          >
            ⚽ Nueva Reserva
          </Link>
        </div>

        {/* Lista de Reservas */}
        <div className="space-y-4">
          {reservas.length > 0 ? (
            reservas.map((reserva) => (
              <div
                key={reserva.id}
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                        reserva.estado === "Confirmada"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {reserva.estado}
                    </span>
                    <span className="text-xs font-extrabold text-slate-800">
                      Bs. {reserva.precio}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-800 text-base">
                    {reserva.cancha}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                    <span>📍 {reserva.ubicacion}</span>
                    <span>📅 {reserva.fecha}</span>
                    <span>⏰ {reserva.hora}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <button
                    type="button"
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition"
                  >
                    Detalles
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 bg-red-50 text-red-600 font-bold text-xs rounded-xl hover:bg-red-100 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center space-y-3">
              <p className="text-2xl">⚽</p>
              <p className="text-sm font-bold text-slate-700">
                No tienes reservas activas
              </p>
              <p className="text-xs text-slate-400">
                Busca una cancha disponible y agenda tu próximo partido.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}