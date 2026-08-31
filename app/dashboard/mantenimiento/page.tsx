"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&auto=format&fit=crop&q=60";

export default function MantenimientoDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [canchasPendientes, setCanchasPendientes] = useState<Cancha[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    const sessionString = localStorage.getItem("userSession");
    if (!sessionString) {
      router.replace("/login");
      return;
    }

    try {
      const session = JSON.parse(sessionString);
      const rol = String(session?.rol || "").trim().toLowerCase();
      if (rol !== "mantenimiento") {
        router.replace("/dashboard/jugador");
      }
    } catch (err) {
      console.error("Error validando permiso de mantenimiento:", err);
      router.replace("/login");
    }
  }, [router]);

  const cargarCanchas = useCallback(async () => {
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
  }, [supabase]);

  useEffect(() => {
    cargarCanchas();
  }, [cargarCanchas]);

  async function cambiarEstadoCancha(
    cancha: Cancha,
    nuevoEstado: "Verificada" | "Rechazada"
  ) {
    setProcessingId(cancha.id_cancha);

    try {
      // 1. Actualizar estado de la cancha a "Verificada" o "Rechazada"
      const { error: errorCancha } = await supabase
        .from("cancha")
        .update({ estado: nuevoEstado })
        .eq("id_cancha", cancha.id_cancha);

      if (errorCancha) {
        throw new Error("Error al actualizar la cancha: " + errorCancha.message);
      }

      // 2. Notificar al propietario (tabla en minúsculas: 'notificacion')
      if (cancha.id_propietario) {
        const { error: errorNotif } = await supabase.from("notificacion").insert({
          id_usuario: cancha.id_propietario,
          titulo:
            nuevoEstado === "Verificada"
              ? "Cancha Aprobada 🎉"
              : "Cancha Rechazada ❌",
          mensaje: `La revisión de la cancha "${cancha.nombre}" ha finalizado. Estado: ${nuevoEstado.toUpperCase()}`,
          leido: false,
        });

        if (errorNotif) {
          console.error("Error al notificar al propietario:", errorNotif.message);
        }
      }

      // Recargar la lista de solicitudes
      await cargarCanchas();
    } catch (err: unknown) {
      const mensajeError =
        err instanceof Error ? err.message : "Ocurrió un error inesperado.";
      alert(mensajeError);
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="space-y-6 text-slate-800">
      <header className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-6 text-white">
        <h1 className="text-3xl font-black">🛠️ Panel de Mantenimiento</h1>
        <p className="mt-1 text-xs text-amber-200">
          Verifica las canchas pendientes de aprobación para habilitarlas en la plataforma.
        </p>
      </header>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Canchas por Revisar</h2>

        {loading ? (
          <p className="animate-pulse text-xs text-slate-400">
            Cargando solicitudes...
          </p>
        ) : canchasPendientes.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-center text-xs text-slate-500">
            ✅ No hay canchas pendientes de revisión.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {canchasPendientes.map((cancha) => {
              const srcImagen =
                cancha.imagen && cancha.imagen.trim() !== ""
                  ? cancha.imagen
                  : FALLBACK_IMAGE;

              return (
                <div
                  key={cancha.id_cancha}
                  className="flex flex-col justify-between overflow-hidden rounded-2xl bg-white shadow-lg"
                >
                  {/* Imagen */}
                  <div className="relative h-48 w-full bg-slate-100">
                    <Image
                      src={srcImagen}
                      alt={cancha.nombre}
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover"
                    />
                    <span className="absolute right-3 top-3 rounded-full bg-amber-500/90 px-3 py-1 text-[10px] font-bold text-white shadow-md backdrop-blur-sm">
                      PENDIENTE
                    </span>
                  </div>

                  {/* Detalles */}
                  <div className="flex flex-1 flex-col justify-between space-y-3 p-5">
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold leading-snug text-slate-900">
                        {cancha.nombre}
                      </h3>

                      <div className="space-y-1.5 text-xs font-medium text-slate-600">
                        <p className="flex items-center gap-1.5">
                          ⚽ <span><strong>Tipo de Juego:</strong> {cancha.tipo_juego}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          💰 <span><strong>Precio:</strong> Bs. {cancha.precio} / hr</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          📍 <strong>Ubicación:</strong>{" "}
                          <a
                            href={cancha.ubicacion}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-emerald-600 hover:underline"
                          >
                            Ver en Google Maps
                          </a>
                        </p>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2 pt-4">
                      <button
                        disabled={processingId === cancha.id_cancha}
                        onClick={() => cambiarEstadoCancha(cancha, "Verificada")}
                        className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
                      >
                        {processingId === cancha.id_cancha
                          ? "Procesando..."
                          : "Aprobar Cancha"}
                      </button>

                      <button
                        disabled={processingId === cancha.id_cancha}
                        onClick={() => cambiarEstadoCancha(cancha, "Rechazada")}
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-100 active:scale-[0.98] disabled:opacity-50"
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}