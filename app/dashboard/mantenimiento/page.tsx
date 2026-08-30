"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/app/lib/supabase/client";

interface Cancha {
  id_cancha: number;
  nombre: string;
  ubicacion: string;
  tipo_juego: string;
  precio: number;
  imagen: string;
  estado: string;
  id_propietario: number;
}

export default function MantenimientoDashboard() {
  const supabase = createClient();
  const [canchasPendientes, setCanchasPendientes] = useState<Cancha[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarCanchas();
  }, []);

  async function cargarCanchas() {
    setLoading(true);
    const { data, error } = await supabase
      .from("cancha")
      .select("*")
      .eq("estado", "Pendiente");

    if (error) {
      console.error("Error cargando canchas pendientes:", error);
    } else {
      setCanchasPendientes(data || []);
    }
    setLoading(false);
  }

  async function cambiarEstadoCancha(cancha: Cancha, nuevoEstado: "disponible" | "rechazado") {
    // 1. Actualizar estado de la cancha
    const { error } = await supabase
      .from("cancha")
      .update({ estado: nuevoEstado })
      .eq("id_cancha", cancha.id_cancha);

    if (error) {
      alert("Error al actualizar la cancha: " + error.message);
      return;
    }

    // 2. Notificar al propietario
    if (cancha.id_propietario) {
      await supabase.from("notificacion").insert({
        id_usuario: cancha.id_propietario,
        titulo: nuevoEstado === "disponible" ? "Cancha Aprobada 🎉" : "Cancha Rechazada ❌",
        mensaje: `La revisión de la cancha "${cancha.nombre}" ha finalizado. Estado: ${nuevoEstado.toUpperCase()}`,
      });
    }

    cargarCanchas();
  }

  return (
    <div className="space-y-6 text-slate-800">
      <header className="rounded-3xl bg-amber-500/10 border border-amber-500/20 p-6 text-white">
        <h1 className="text-3xl font-black">🛠️ Panel de Mantenimiento</h1>
        <p className="text-xs text-amber-200 mt-1">
          Verifica las canchas pendientes de aprobación para habilitarlas en la plataforma.
        </p>
      </header>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Canchas por Revisar</h2>

        {loading ? (
          <p className="text-xs text-slate-400 animate-pulse">Cargando solicitudes...</p>
        ) : canchasPendientes.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-center text-xs text-slate-500">
            ✅ No hay canchas pendientes de revisión.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {canchasPendientes.map((cancha) => (
              <div key={cancha.id_cancha} className="rounded-2xl bg-white p-5 shadow-lg space-y-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{cancha.nombre}</h3>
                  <p className="text-xs font-semibold text-amber-600">Estado: PENDIENTE DE REVISIÓN</p>
                </div>

                <div className="space-y-1 text-xs text-slate-600">
                  <p>⚽ <strong>Tipo:</strong> {cancha.tipo_juego}</p>
                  <p>💰 <strong>Precio:</strong> Bs. {cancha.precio}/hr</p>
                  <p>📍 <strong>Ubicación:</strong> <a href={cancha.ubicacion} target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline">Ver en Google Maps</a></p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => cambiarEstadoCancha(cancha, "disponible")}
                    className="flex-1 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
                  >
                    Aprobar Cancha
                  </button>
                  <button
                    onClick={() => cambiarEstadoCancha(cancha, "rechazado")}
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100 transition"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}