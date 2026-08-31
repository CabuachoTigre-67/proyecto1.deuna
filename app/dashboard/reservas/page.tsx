"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/app/lib/supabase/client";

interface Cancha {
  id_cancha: number;
  nombre: string;
  precio: number;
  ubicacion: string;
  imagen?: string;
  tipo_juego?: string;
}

interface Disponibilidad {
  id_disponibilidad: number;
  dia_semana?: string;
  hora_inicio?: string;
  hora_fin?: string;
  cancha?: Cancha;
}

interface Partido {
  id_partido: number;
  fecha?: string;
  monto_presupuesto_total?: number;
  disponibilidaddecancha?: Disponibilidad;
}

interface InscripcionPartido {
  id_inscripcion: number;
  id_partido: number;
  id_jugador: string;
  equipo?: string;
  monto_individual?: number;
  estado_pago?: string;
  partido?: Partido;
}

export default function MisReservasPage() {
  const supabase = createClient();
  const [inscripciones, setInscripciones] = useState<InscripcionPartido[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filtro, setFiltro] = useState<"por_jugar" | "jugados">("por_jugar");

  useEffect(() => {
    obtenerPartidosDelJugador();
  }, []);

  async function obtenerPartidosDelJugador() {
    setLoading(true);
    try {
      const { data: userAuth } = await supabase.auth.getUser();

      if (!userAuth?.user?.id) {
        setLoading(false);
        return;
      }

      const uuidJugador = userAuth.user.id;

      const { data, error } = await supabase
        .from("inscripcionpartido")
        .select(`
          id_inscripcion,
          id_partido,
          id_jugador,
          equipo,
          monto_individual,
          estado_pago,
          partido (
            id_partido,
            fecha,
            monto_presupuesto_total,
            disponibilidaddecancha (
              id_disponibilidad,
              dia_semana,
              hora_inicio,
              hora_fin,
              cancha (
                id_cancha,
                nombre,
                precio,
                ubicacion,
                imagen,
                tipo_juego
              )
            )
          )
        `)
        .eq("id_jugador", uuidJugador);

      if (error) {
        console.error("Error al cargar partidos desde inscripcionpartido:", error.message);
      } else if (data) {
        setInscripciones(data as unknown as InscripcionPartido[]);
      }
    } catch (err) {
      console.error("Error inesperado al cargar partidos:", err);
    } finally {
      setLoading(false);
    }
  }

  const esPartidoPasado = (item: InscripcionPartido): boolean => {
    const partido = item.partido;
    if (!partido || !partido.fecha) return false;

    const fechaStr = partido.fecha.split("T")[0];
    const horaFinStr = partido.disponibilidaddecancha?.hora_fin
      ? partido.disponibilidaddecancha.hora_fin.substring(0, 5)
      : "23:59";

    const fechaPartido = new Date(`${fechaStr}T${horaFinStr}:00`);
    const ahora = new Date();

    return fechaPartido < ahora;
  };

  const partidosPorJugar = inscripciones.filter((i) => !esPartidoPasado(i));
  const partidosJugados = inscripciones.filter((i) => esPartidoPasado(i));
  const inscripcionesAMostrar = filtro === "por_jugar" ? partidosPorJugar : partidosJugados;

  const formatearHora = (hora?: string) => (hora ? hora.substring(0, 5) : "--:--");

  const formatearFecha = (fechaStr?: string) => {
    if (!fechaStr) return "";
    const [year, month, day] = fechaStr.split("T")[0].split("-");
    return `${day}/${month}/${year}`;
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm font-bold" style={{ color: "var(--accent)" }}>
        Cargando tus partidos...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6" style={{ color: "var(--foreground)" }}>
      <div className="flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-center" style={{ borderColor: "var(--border)" }}>
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--accent)" }}>
            DEUNA !
          </span>
          <h1 className="mt-2 text-2xl font-black sm:text-3xl" style={{ color: "var(--foreground)" }}>
            Mis Partidos
          </h1>
          <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
            Revisa los partidos en los que estás inscrito y tu historial de juego.
          </p>
        </div>

        <div className="flex w-fit rounded-xl border p-1 shadow-sm" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <button
            onClick={() => setFiltro("por_jugar")}
            className="rounded-lg px-3 py-2 text-[11px] font-bold transition sm:px-4"
            style={{
              background: filtro === "por_jugar" ? "var(--accent)" : "transparent",
              color: filtro === "por_jugar" ? "#ffffff" : "var(--muted)",
            }}
          >
            Próximos ({partidosPorJugar.length})
          </button>
          <button
            onClick={() => setFiltro("jugados")}
            className="rounded-lg px-3 py-2 text-[11px] font-bold transition sm:px-4"
            style={{
              background: filtro === "jugados" ? "var(--accent)" : "transparent",
              color: filtro === "jugados" ? "#ffffff" : "var(--muted)",
            }}
          >
            Jugados / Pasados ({partidosJugados.length})
          </button>
        </div>
      </div>

      {inscripcionesAMostrar.length === 0 ? (
        <div className="rounded-3xl border p-8 text-center shadow-sm sm:p-12" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
            {filtro === "por_jugar"
              ? "No estás inscrito en ningún partido próximo."
              : "No tienes historial de partidos ya jugados."}
          </p>
          <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
            {filtro === "por_jugar"
              ? "Explora el dashboard para unirte a un partido disponible."
              : "Los partidos cuya fecha u hora ya transcurrió aparecerán aquí automáticamente."}
          </p>
          {filtro === "por_jugar" && (
            <Link
              href="/dashboard"
              className="mt-5 inline-block rounded-xl px-6 py-2.5 text-xs font-bold transition hover:scale-[1.02]"
              style={{ background: "var(--accent)", color: "#ffffff" }}
            >
              Ver Partidos Disponibles →
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {inscripcionesAMostrar.map((item) => {
            const partido = item.partido;
            const disp = partido?.disponibilidaddecancha;
            const cancha = disp?.cancha;
            const imagenMostrar =
              cancha?.imagen ||
              "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=600&q=80";

            const yaPaso = esPartidoPasado(item);
            const idPartidoFinal = partido?.id_partido ?? item.id_partido;

            return (
              <div
                key={item.id_inscripcion}
                className="flex flex-col justify-between rounded-2xl border p-4 shadow-lg transition duration-200 sm:p-5"
                style={{
                  background: "var(--card)",
                  borderColor: yaPaso ? "var(--border)" : "rgba(34,197,94,0.2)",
                  opacity: yaPaso ? 0.8 : 1,
                  boxShadow: "var(--shadow)",
                }}
              >
                <div className="space-y-4">
                  <div className="relative h-40 w-full overflow-hidden rounded-xl" style={{ background: "var(--surface-alt)" }}>
                    <Image
                      src={imagenMostrar}
                      alt={cancha?.nombre || "Cancha"}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />

                    <div className="absolute left-3 top-3 z-20">
                      <span
                        className="rounded-lg border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md"
                        style={{
                          background: yaPaso ? "rgba(148,163,184,0.18)" : "rgba(22,163,74,0.22)",
                          color: yaPaso ? "var(--foreground)" : "var(--accent)",
                          borderColor: yaPaso ? "rgba(148,163,184,0.25)" : "rgba(22,163,74,0.35)",
                        }}
                      >
                        {yaPaso ? "Finalizado / Jugado" : "Próximo"}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 z-20 text-xs font-bold text-white">
                      📍 {cancha?.ubicacion || "Santa Cruz, Bolivia"}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--warning)" }}>
                      {disp?.dia_semana || "Día de partido"}
                    </span>
                    <h3 className="mt-1 truncate text-lg font-black" style={{ color: "var(--foreground)" }}>
                      {cancha?.nombre || `Partido #${idPartidoFinal}`}
                    </h3>

                    <div className="mt-2 space-y-1 text-xs" style={{ color: "var(--muted)" }}>
                      <p className="flex items-center gap-1 font-semibold" style={{ color: "var(--accent)" }}>
                        ⏰ Horario: {formatearHora(disp?.hora_inicio)} - {formatearHora(disp?.hora_fin)} hs
                      </p>
                      {partido?.fecha && (
                        <p>
                          📅 Fecha: {formatearFecha(partido.fecha)}
                        </p>
                      )}
                      {item.equipo && (
                        <p className="font-medium text-slate-300">
                          👕 Equipo: {item.equipo}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t pt-4" style={{ borderColor: "var(--border)" }}>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                      Monto Individual
                    </p>
                    <p className="text-lg font-black" style={{ color: "var(--foreground)" }}>
                      Bs. {item.monto_individual ?? cancha?.precio ?? 0}
                    </p>
                  </div>

                  {/* Redirección limpia hacia /dashboard/reservas/mvp */}
                  {idPartidoFinal ? (
                    <Link
                      href={`/dashboard/reservas/mvp?id_partido=${idPartidoFinal}`}
                      className="rounded-xl px-4 py-2 text-[11px] font-black transition hover:scale-[1.02]"
                      style={{ background: "var(--accent)", color: "#ffffff" }}
                    >
                      Ver detalle
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="rounded-xl px-4 py-2 text-[11px] font-black opacity-50 cursor-not-allowed"
                      style={{ background: "var(--accent)", color: "#ffffff" }}
                    >
                      Sin ID
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}