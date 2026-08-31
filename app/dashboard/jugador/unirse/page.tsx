"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/app/lib/supabase/client";

interface Cancha {
  id_cancha: number;
  nombre: string;
  precio: number;
  ubicacion: string;
  imagen: string;
  tipo_juego?: string;
}

interface DisponibilidadCancha {
  id_disponibilidad: number;
  id_cancha: number;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  esta_ocupada: boolean;
  cancha?: Cancha;
}

interface PartidoData {
  id_partido: number;
  fecha: string;
  monto_presupuesto_total: number;
  id_disponibilidad: number;
  disponibilidaddecancha: DisponibilidadCancha;
}

interface JugadorInscrito {
  id_inscripcion: number;
  id_jugador: string;
  equipo?: string;
  monto_individual?: number;
  estado_pago?: string;
  usuario?: {
    nombre?: string;
    apellido?: string;
    posicion_juego?: string;
  };
}

interface TercerTiempoItem {
  id_tercer_tiempo: number;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
}

function UnirseContent() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const idDisponibilidad = searchParams.get("id_disponibilidad");

  const [loading, setLoading] = useState<boolean>(true);
  const [procesandoInscripcion, setProcesandoInscripcion] = useState<boolean>(false);
  const [yaInscrito, setYaInscrito] = useState<boolean>(false);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<string>("Equipo A");

  const [partido, setPartido] = useState<PartidoData | null>(null);
  const [jugadores, setJugadores] = useState<JugadorInscrito[]>([]);
  const [tercerTiempo, setTercerTiempo] = useState<TercerTiempoItem[]>([]);

  useEffect(() => {
    if (idDisponibilidad) {
      cargarDetallesPartido(parseInt(idDisponibilidad, 10));
    } else {
      setLoading(false);
    }
  }, [idDisponibilidad]);

  async function cargarDetallesPartido(idDisp: number) {
    setLoading(true);
    try {
      let { data: partidoData } = await supabase
        .from("partido")
        .select(`
          id_partido,
          fecha,
          monto_presupuesto_total,
          id_disponibilidad,
          disponibilidaddecancha (
            id_disponibilidad,
            id_cancha,
            dia_semana,
            hora_inicio,
            hora_fin,
            esta_ocupada,
            cancha (
              id_cancha,
              nombre,
              precio,
              ubicacion,
              imagen,
              tipo_juego
            )
          )
        `)
        .eq("id_disponibilidad", idDisp)
        .maybeSingle();

      if (!partidoData) {
        const { data: dispData, error: dispError } = await supabase
          .from("disponibilidaddecancha")
          .select(`
            id_disponibilidad,
            id_cancha,
            dia_semana,
            hora_inicio,
            hora_fin,
            esta_ocupada,
            cancha (
              id_cancha,
              nombre,
              precio,
              ubicacion,
              imagen,
              tipo_juego
            )
          `)
          .eq("id_disponibilidad", idDisp)
          .single();

        if (dispError || !dispData) {
          console.error("Error al obtener disponibilidad:", dispError?.message);
          setPartido(null);
          return;
        }

        partidoData = {
          id_partido: 0,
          fecha: new Date().toISOString().split("T")[0],
          monto_presupuesto_total: (dispData as any).cancha?.precio || 0,
          id_disponibilidad: idDisp,
          disponibilidaddecancha: dispData as unknown as DisponibilidadCancha,
        };
      }

      setPartido(partidoData as unknown as PartidoData);

      if (partidoData.id_partido !== 0) {
        // 1. Obtener inscripciones de la tabla 'inscripcionpartido'
        const { data: inscritosData, error: inscritosError } = await supabase
          .from("inscripcionpartido")
          .select(`
            id_inscripcion,
            id_partido,
            id_jugador,
            equipo,
            monto_individual,
            estado_pago
          `)
          .eq("id_partido", partidoData.id_partido);

        if (!inscritosError && inscritosData) {
          // 2. Traer la información de perfil de la tabla 'usuario' vinculando por correo/sesión
          const { data: usuariosBD } = await supabase
            .from("usuario")
            .select("nombre, apellido, posicion_juego, correo");

          const jugadoresConPerfil: JugadorInscrito[] = inscritosData.map((ins: any) => ({
            ...ins,
            usuario: usuariosBD?.find((u) => u.correo === ins.id_jugador) || undefined,
          }));

          setJugadores(jugadoresConPerfil);

          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const existe = inscritosData.some(
              (i: any) => String(i.id_jugador) === String(user.id)
            );
            setYaInscrito(existe);
          }
        }
      }

      // Consulta dinámica a la tabla 'tercertiempo' del esquema
      const { data: tercerTiempoData } = await supabase
        .from("tercertiempo")
        .select("*")
        .eq("id_disponibilidad", idDisp);

      if (tercerTiempoData && tercerTiempoData.length > 0) {
        setTercerTiempo(tercerTiempoData as TercerTiempoItem[]);
      }
    } catch (err) {
      console.error("Error al obtener los detalles:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleInscribirse = async () => {
    if (!partido) return;
    setProcesandoInscripcion(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        alert("Debes iniciar sesión para unirte a un partido.");
        setProcesandoInscripcion(false);
        router.push("/login");
        return;
      }

      let targetPartidoId = partido.id_partido;

      if (targetPartidoId === 0) {
        const { data: nuevoPartido, error: errorCrearPartido } = await supabase
          .from("partido")
          .insert([
            {
              fecha: new Date().toISOString().split("T")[0],
              monto_presupuesto_total: partido.disponibilidaddecancha.cancha?.precio || 0,
              id_disponibilidad: partido.id_disponibilidad,
            },
          ])
          .select()
          .single();

        if (errorCrearPartido || !nuevoPartido) {
          alert("Error al registrar el partido: " + errorCrearPartido?.message);
          setProcesandoInscripcion(false);
          return;
        }

        targetPartidoId = nuevoPartido.id_partido;
      }

      const { error: errorInscripcion } = await supabase.from("inscripcionpartido").insert([
        {
          id_partido: targetPartidoId,
          id_jugador: user.id, // Envía el UUID directo del usuario autenticado
          equipo: equipoSeleccionado,
          monto_individual: (partido.disponibilidaddecancha.cancha?.precio || 0) / 10,
        },
      ]);

      if (errorInscripcion) {
        alert("Error al inscribirte: " + errorInscripcion.message);
      } else {
        alert(`¡Inscripción exitosa en el ${equipoSeleccionado}!`);
        setYaInscrito(true);
        await cargarDetallesPartido(partido.id_disponibilidad);
      }
    } catch (err) {
      console.error("Error al procesar inscripción:", err);
    } finally {
      setProcesandoInscripcion(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm font-bold text-emerald-400">
        Cargando detalles del partido...
      </div>
    );
  }

  if (!partido) {
    return (
      <div className="mx-auto max-w-4xl p-6 text-center text-slate-300 space-y-4">
        <h2 className="text-2xl font-bold">Partido no encontrado</h2>
        <button
          onClick={() => router.back()}
          className="rounded-xl bg-slate-800 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          Volver atrás
        </button>
      </div>
    );
  }

  const disp = partido.disponibilidaddecancha;
  const cancha = disp?.cancha;

  const obtenerImagenSrc = (img?: string) => {
    if (!img) return "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80";
    if (img.startsWith("http://") || img.startsWith("https://")) return img;
    return img.startsWith("/") ? img : `/${img}`;
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6 text-slate-100">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition"
      >
        ← Volver a partidos
      </button>

      {/* DETALLES DE LA CANCHA */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="relative h-64 sm:h-80 w-full">
          <Image
            src={obtenerImagenSrc(cancha?.imagen)}
            alt={cancha?.nombre || "Cancha"}
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
        </div>

        <div className="p-6 sm:p-8 space-y-6 -mt-20 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="inline-block rounded-md bg-emerald-500/20 px-3 py-1 text-xs font-extrabold text-emerald-400 border border-emerald-500/30 mb-2">
                {cancha?.tipo_juego || "Fútbol"}
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-white">
                {cancha?.nombre || "Cancha Deportiva"}
              </h1>
              <p className="text-sm text-slate-400 mt-1 flex items-center gap-1">
                📍 {cancha?.ubicacion || "Ubicación no disponible"}
              </p>
            </div>

            <div className="bg-slate-950/90 backdrop-blur-md p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center gap-4">
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400">
                  Precio Total
                </span>
                <span className="text-2xl font-black text-amber-400">
                  Bs. {cancha?.precio || "--"}
                </span>
              </div>

              {!yaInscrito && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Seleccionar Equipo
                  </label>
                  <select
                    value={equipoSeleccionado}
                    onChange={(e) => setEquipoSeleccionado(e.target.value)}
                    className="bg-slate-900 text-xs text-white border border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-emerald-500"
                  >
                    <option value="Equipo A">Equipo A</option>
                    <option value="Equipo B">Equipo B</option>
                  </select>
                </div>
              )}

              {yaInscrito ? (
                <button
                  disabled
                  className="rounded-xl bg-emerald-600/30 border border-emerald-500/50 px-6 py-3 text-xs sm:text-sm font-bold text-emerald-400"
                >
                  ✓ Ya estás inscrito
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleInscribirse}
                  disabled={procesandoInscripcion}
                  className="rounded-xl bg-[#f95721] hover:bg-[#e04816] px-6 py-3 text-xs sm:text-sm font-extrabold text-white shadow-lg transition active:scale-95 disabled:opacity-50"
                >
                  {procesandoInscripcion ? "Procesando..." : "Unirme al Partido"}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[10px] font-bold uppercase text-slate-500">Día</span>
              <p className="text-sm font-extrabold text-white mt-0.5">{disp?.dia_semana}</p>
            </div>
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[10px] font-bold uppercase text-slate-500">Horario</span>
              <p className="text-sm font-extrabold text-emerald-400 mt-0.5">
                {disp?.hora_inicio?.substring(0, 5)} - {disp?.hora_fin?.substring(0, 5)} hs
              </p>
            </div>
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[10px] font-bold uppercase text-slate-500">Inscritos</span>
              <p className="text-sm font-extrabold text-amber-400 mt-0.5">
                {jugadores.length} Jugadores
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN JUGADORES Y TERCER TIEMPO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>⚽</span> Jugadores Confirmados
              </h2>
              <p className="text-xs text-slate-400">
                {jugadores.length} participantes registrados
              </p>
            </div>
          </div>

          {jugadores.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              Sé el primero en inscribirte a este partido.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
              {jugadores.map((jugador) => {
                const nombreMostrar = jugador.usuario
                  ? `${jugador.usuario.nombre || ""} ${jugador.usuario.apellido || ""}`.trim()
                  : `Jugador #${jugador.id_jugador.slice(0, 5)}`;

                return (
                  <div
                    key={jugador.id_inscripcion}
                    className="flex items-center gap-3 p-3 rounded-2xl border border-slate-800 bg-slate-950/60"
                  >
                    <div className="relative h-10 w-10 overflow-hidden rounded-full border border-slate-700 bg-slate-800 flex items-center justify-center font-bold text-emerald-400 flex-shrink-0">
                      {nombreMostrar.charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-white truncate">
                        {nombreMostrar}
                      </p>
                      <span className="text-[10px] text-emerald-400 font-semibold uppercase">
                        {jugador.equipo ? jugador.equipo : "Sin equipo"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>🍻</span> Tercer Tiempo & Menú
            </h2>
            <p className="text-xs text-slate-400">
              Servicios disponibles en el recinto para después del partido.
            </p>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {tercerTiempo.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                No hay productos registrados para el tercer tiempo en esta cancha.
              </p>
            ) : (
              tercerTiempo.map((item) => (
                <div
                  key={item.id_tercer_tiempo}
                  className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-slate-800 bg-slate-950/60"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl p-2 bg-slate-900 rounded-xl border border-slate-800">
                      🍽️
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-white">{item.nombre_producto}</h3>
                      <p className="text-xs text-slate-400">Disponible: {item.cantidad} unidades</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-sm font-black text-amber-400">
                      Bs. {item.precio_unitario}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UnirsePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center text-sm font-bold text-emerald-400">
          Cargando...
        </div>
      }
    >
      <UnirseContent />
    </Suspense>
  );
}