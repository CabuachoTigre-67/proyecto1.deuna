"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/app/lib/supabase/client";

interface Cancha {
  id_cancha: number;
  nombre: string;
  direccion?: string;
  tipo_superficie?: string;
  precio_hora?: number;
  estado?: string;
  imagen_url?: string;
}

export default function DashboardCanchasPage() {
  const supabase = createClient();

  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCanchas() {
      try {
        const { data, error: supabaseError } = await supabase
          .from("cancha")
          .select("*")
          .order("id_cancha", { ascending: true });

        if (supabaseError) throw supabaseError;

        setCanchas(data || []);
      } catch (err: any) {
        console.error("Error al cargar canchas:", err);
        setError("No se pudieron cargar las canchas disponibles.");
      } finally {
        setLoading(false);
      }
    }

    loadCanchas();
  }, [supabase]);

  // Filtrado de canchas según búsqueda
  const canchasFiltradas = canchas.filter((cancha) => {
    const term = searchTerm.toLowerCase();
    return (
      cancha.nombre?.toLowerCase().includes(term) ||
      cancha.tipo_superficie?.toLowerCase().includes(term) ||
      cancha.direccion?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8 font-sans text-slate-800">
      {/* Encabezado y Acción Principal */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Canchas Disponibles
          </h1>
          <p className="mt-1 text-xs font-medium text-emerald-200/80">
            Explora las instalaciones deportivas o añade un nuevo campo de juego.
          </p>
        </div>

        {/* Botón para Añadir Nueva Cancha */}
        <Link
          href="/dashboard/canchas/nueva"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition active:scale-95"
        >
          <span className="text-base font-black">+</span> Añadir Nueva Cancha
        </Link>
      </div>

      {/* Contenedor Principal en Tarjeta Blanca */}
      <div className="rounded-3xl bg-white p-6 shadow-xl sm:p-8 space-y-6">
        {/* Barra de Búsqueda */}
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar cancha por nombre, superficie o ubicación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 pl-10 text-sm font-medium text-slate-800 outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/20 transition"
          />
          <span className="absolute left-3.5 top-3.5 text-slate-400 text-sm">
            🔍
          </span>
        </div>

        {/* Estado de Carga */}
        {loading && (
          <div className="py-12 text-center">
            <p className="animate-pulse text-sm font-semibold text-emerald-600">
              Cargando catálogo de canchas...
            </p>
          </div>
        )}

        {/* Estado de Error */}
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-xs font-bold text-red-600">
            ⚠️ {error}
          </div>
        )}

        {/* Lista de Canchas */}
        {!loading && !error && (
          <>
            {canchasFiltradas.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <p className="text-sm font-bold">No se encontraron canchas.</p>
                <p className="text-xs text-slate-400 mt-1">
                  Intenta con otros términos de búsqueda o registra una nueva.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {canchasFiltradas.map((cancha) => (
                  <div
                    key={cancha.id_cancha}
                    className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition flex flex-col justify-between"
                  >
                    {/* Imagen / Placeholder */}
                    <div className="relative h-40 w-full bg-slate-100 flex items-center justify-center overflow-hidden">
                      {cancha.imagen_url ? (
                        <img
                          src={cancha.imagen_url}
                          alt={cancha.nombre}
                          className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-slate-400">
                          <span className="text-3xl">⚽</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider">
                            Sin Imagen
                          </span>
                        </div>
                      )}
                      {cancha.tipo_superficie && (
                        <span className="absolute top-3 left-3 rounded-lg bg-slate-900/80 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                          {cancha.tipo_superficie}
                        </span>
                      )}
                    </div>

                    {/* Información de la Cancha */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 capitalize group-hover:text-emerald-600 transition">
                          {cancha.nombre}
                        </h3>
                        {cancha.direccion && (
                          <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                            📍 {cancha.direccion}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                        <div>
                          <span className="block text-[10px] font-bold uppercase text-slate-400">
                            Precio / Hora
                          </span>
                          <span className="text-sm font-black text-emerald-600">
                            Bs. {cancha.precio_hora ?? "--"}
                          </span>
                        </div>

                        <Link
                          href={`/dashboard/canchas/${cancha.id_cancha}`}
                          className="rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-600 hover:text-white transition"
                        >
                          Ver Detalle
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}