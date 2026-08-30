"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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

export default function MisCanchasProjectsPage() {
  const supabase = createClient();
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [loading, setLoading] = useState(true);
  const [idUsuario, setIdUsuario] = useState<number | null>(null);
  const [tabActual, setTabActual] = useState<"todas" | "verificadas" | "pendientes" | "rechazadas">("todas");

  useEffect(() => {
    cargarTodasLasCanchas();
  }, []);

  async function cargarTodasLasCanchas() {
    setLoading(true);
    const sessionString = localStorage.getItem("userSession");

    if (sessionString) {
      try {
        const session = JSON.parse(sessionString);
        if (session?.id_usuario) {
          setIdUsuario(session.id_usuario);
        }
      } catch (err) {
        console.error("Error al parsear la sesión:", err);
      }
    }

    try {
      const { data, error } = await supabase
        .from("cancha")
        .select("*")
        .order("id_cancha", { ascending: false });

      if (error) {
        console.error("Error al obtener las canchas:", error);
      } else {
        setCanchas(data || []);
      }
    } catch (err) {
      console.error("Error al cargar las canchas:", err);
    } finally {
      setLoading(false);
    }
  }

  function obtenerEstadoNormalizado(estado: string) {
    const est = (estado || "").toLowerCase().trim();
    if (est === "disponible" || est === "verificada" || est === "aprobada") return "Verificada";
    if (est === "pendiente") return "Pendiente";
    if (est === "rechazado" || est === "rechazada") return "Rechazada";
    return estado;
  }

  function renderBadgeEstado(estado: string) {
    const estadoNorm = obtenerEstadoNormalizado(estado);

    switch (estadoNorm) {
      case "Verificada":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
            🟢 Verificada
          </span>
        );
      case "Pendiente":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
            ⏳ Pendiente
          </span>
        );
      case "Rechazada":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800">
            🔴 Rechazada
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
            {estado}
          </span>
        );
    }
  }

  const canchasFiltradas = canchas.filter((cancha) => {
    const estadoNorm = obtenerEstadoNormalizado(cancha.estado);
    const esMiCancha = idUsuario !== null && cancha.id_propietario === idUsuario;

    if (tabActual === "todas") {
      return estadoNorm === "Verificada";
    }

    if (tabActual === "verificadas") {
      return esMiCancha && estadoNorm === "Verificada";
    }

    if (tabActual === "pendientes") {
      return esMiCancha && estadoNorm === "Pendiente";
    }

    if (tabActual === "rechazadas") {
      return esMiCancha && estadoNorm === "Rechazada";
    }

    return true;
  });

  const conteo = {
    todas: canchas.filter((c) => obtenerEstadoNormalizado(c.estado) === "Verificada").length,
    verificadas: canchas.filter(
      (c) => idUsuario !== null && c.id_propietario === idUsuario && obtenerEstadoNormalizado(c.estado) === "Verificada"
    ).length,
    pendientes: canchas.filter(
      (c) => idUsuario !== null && c.id_propietario === idUsuario && obtenerEstadoNormalizado(c.estado) === "Pendiente"
    ).length,
    rechazadas: canchas.filter(
      (c) => idUsuario !== null && c.id_propietario === idUsuario && obtenerEstadoNormalizado(c.estado) === "Rechazada"
    ).length,
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 text-slate-800">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">🏟️ Mis Canchas Registradas</h1>
          <p className="text-xs text-slate-300">
            Gestión de tus instalaciones deportivas y seguimiento del estado de revisión.
          </p>
        </div>

        <Link
          href="/dashboard/projects/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-emerald-700 active:scale-[0.98]"
        >
          ➕ Solicitar Alta de Cancha
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl bg-slate-900/60 p-2 border border-slate-800">
        <button
          onClick={() => setTabActual("todas")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            tabActual === "todas"
              ? "bg-emerald-600 text-white shadow"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Todas ({conteo.todas})
        </button>

        <button
          onClick={() => setTabActual("verificadas")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            tabActual === "verificadas"
              ? "bg-emerald-600 text-white shadow"
              : "text-slate-400 hover:text-white"
          }`}
        >
          🟢 Verificadas ({conteo.verificadas})
        </button>

        <button
          onClick={() => setTabActual("pendientes")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            tabActual === "pendientes"
              ? "bg-emerald-600 text-white shadow"
              : "text-slate-400 hover:text-white"
          }`}
        >
          ⏳ Pendientes ({conteo.pendientes})
        </button>

        <button
          onClick={() => setTabActual("rechazadas")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            tabActual === "rechazadas"
              ? "bg-emerald-600 text-white shadow"
              : "text-slate-400 hover:text-white"
          }`}
        >
          🔴 Rechazadas ({conteo.rechazadas})
        </button>
      </div>

      {loading ? (
        <div className="rounded-3xl bg-white p-8 text-center text-xs font-semibold text-slate-400 animate-pulse">
          Cargando instalaciones...
        </div>
      ) : canchasFiltradas.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center shadow-lg border border-slate-100">
          <p className="text-sm font-bold text-slate-800">
            No se encontraron canchas {tabActual !== "todas" ? `en estado "${tabActual}"` : "verificadas en el sistema"}.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Regístralas desde el botón superior para enviar la solicitud al área de mantenimiento.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {canchasFiltradas.map((c) => (
            <div
              key={c.id_cancha}
              className="flex flex-col justify-between overflow-hidden rounded-3xl bg-white shadow-lg border border-slate-100 transition hover:shadow-xl"
            >
              {/* Contenedor de la Imagen */}
              <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                {c.imagen ? (
                  <img
                    src={c.imagen}
                    alt={c.nombre}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1529900241469-a2a857f4f039?q=80&w=800&auto=format&fit=crop";
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400 text-xs font-medium">
                    Sin imagen disponible
                  </div>
                )}
              </div>

              {/* Contenido de la Tarjeta */}
              <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-900 text-base">{c.nombre}</h3>
                    {renderBadgeEstado(c.estado)}
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <p>
                      ⚽ <strong className="text-slate-800">Tipo:</strong> {c.tipo_juego}
                    </p>
                    <p>
                      💰 <strong className="text-slate-800">Precio por Hora:</strong> Bs. {c.precio}
                    </p>
                  </div>
                </div>

                {/* El botón solo se muestra cuando el usuario está en la pestaña "Verificadas" */}
                {tabActual === "verificadas" && (
                  <Link
                    href={`/dashboard/projects/new/horario?id_cancha=${c.id_cancha}`}
                    className="block text-center w-full rounded-xl bg-[#f95721] hover:bg-[#e04816] text-white py-2.5 text-xs font-bold transition shadow-sm active:scale-[0.98]"
                  >
                    📅 Configurar Horarios y Servicios
                  </Link>
                )}

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <a
                    href={c.ubicacion}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-emerald-600 hover:underline"
                  >
                    📍 Ver en Mapa
                  </a>
                  <span className="font-mono text-slate-400">ID #{c.id_cancha}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}