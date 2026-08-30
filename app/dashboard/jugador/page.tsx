"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/app/lib/supabase/client";

interface Cancha {
  id_cancha: number;
  nombre: string;
  precio: number;
  ubicacion: string;
  imagen: string;
  tipo_juego?: string;
  calificacion?: number;
  distancia_km?: number;
}

interface DisponibilidadCancha {
  id_disponibilidad: number;
  id_cancha: number;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  esta_ocupada: boolean;
  jugadores_inscritos?: number; // Cantidad actual de inscritos
  min_jugadores?: number;      // Mínimo para completar (ej. 10 o 11)
  max_jugadores?: number;      // Cupo máximo (ej. 14)
  cancha?: Cancha;
}

interface PerfilUsuario {
  dias_preferidos: string[];
  hora_inicio_preferida: string;
  hora_fin_preferida: string;
}

export default function DashboardPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState<boolean>(true);

  const [perfil, setPerfil] = useState<PerfilUsuario>({
    dias_preferidos: ["Sábado", "Domingo", "Lunes"],
    hora_inicio_preferida: "16:00",
    hora_fin_preferida: "22:00",
  });

  const [todosLosTurnos, setTodosLosTurnos] = useState<DisponibilidadCancha[]>([]);
  const [mejoresRecomendados, setMejoresRecomendados] = useState<DisponibilidadCancha[]>([]);
  const [masCercanosEnTiempo, setMasCercanosEnTiempo] = useState<DisponibilidadCancha[]>([]);
  const [porDiasPreferidos, setPorDiasPreferidos] = useState<DisponibilidadCancha[]>([]);
  const [porHorariosPreferidos, setPorHorariosPreferidos] = useState<DisponibilidadCancha[]>([]);

  const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setLoading(true);
    try {
      const { data: userAuth } = await supabase.auth.getUser();
      if (userAuth?.user) {
        const { data: perfilData } = await supabase
          .from("perfil")
          .select("dias_preferidos, hora_inicio_preferida, hora_fin_preferida")
          .eq("id_usuario", userAuth.user.id)
          .maybeSingle();

        if (perfilData) {
          setPerfil({
            dias_preferidos: perfilData.dias_preferidos || ["Sábado", "Domingo", "Lunes"],
            hora_inicio_preferida: perfilData.hora_inicio_preferida || "16:00",
            hora_fin_preferida: perfilData.hora_fin_preferida || "22:00",
          });
        }
      }

      const { data, error } = await supabase
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
        .eq("esta_ocupada", false);

      if (error) {
        console.error("Error al obtener disponibilidades:", error.message);
        setTodosLosTurnos([]);
        return;
      }

      if (data && data.length > 0) {
        const turnos = data as unknown as DisponibilidadCancha[];
        setTodosLosTurnos(turnos);
        procesarSecciones(turnos, perfil);
      } else {
        setTodosLosTurnos([]);
      }
    } catch (err) {
      console.error("Error inesperado en Dashboard:", err);
    } finally {
      setLoading(false);
    }
  }

  function procesarSecciones(turnos: DisponibilidadCancha[], userPerfil: PerfilUsuario) {
    const normalizarHora = (h: string) => (h ? h.substring(0, 5) : "00:00");
    const horaActual = new Date().toTimeString().substring(0, 5);

    const recomendadosPonderados = turnos.map((t) => {
      let score = 0;
      const hInicio = normalizarHora(t.hora_inicio);

      const coincideDia = userPerfil.dias_preferidos.some(
        (d) => d.toLowerCase() === (t.dia_semana || "").toLowerCase()
      );
      if (coincideDia) score += 35;

      if (hInicio >= userPerfil.hora_inicio_preferida && hInicio <= userPerfil.hora_fin_preferida) {
        score += 25;
      }

      if (hInicio >= horaActual) {
        score += 20;
      }

      const rating = t.cancha?.calificacion || 4.5;
      score += rating * 5;

      const dist = t.cancha?.distancia_km || 3.0;
      if (dist <= 3) score += 15;
      else if (dist <= 7) score += 8;

      return { turno: t, score };
    });

    const ordenadosPorScore = recomendadosPonderados
      .sort((a, b) => b.score - a.score)
      .map((item) => item.turno);

    setMejoresRecomendados(ordenadosPorScore.slice(0, 5));

    const cercanos = [...turnos]
      .sort((a, b) => normalizarHora(a.hora_inicio).localeCompare(normalizarHora(b.hora_inicio)))
      .slice(0, 10);
    setMasCercanosEnTiempo(cercanos);

    const porDias = turnos.filter((t) =>
      userPerfil.dias_preferidos.some(
        (d) => d.toLowerCase() === (t.dia_semana || "").toLowerCase()
      )
    );
    setPorDiasPreferidos(porDias.length > 0 ? porDias : turnos);

    const porHorarios = turnos.filter((t) => {
      const h = normalizarHora(t.hora_inicio);
      return h >= userPerfil.hora_inicio_preferida && h <= userPerfil.hora_fin_preferida;
    });
    setPorHorariosPreferidos(porHorarios.length > 0 ? porHorarios : turnos);
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm font-bold text-emerald-400">
        Cargando partidos disponibles...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-10 p-6 text-slate-100">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
          DEUNA !
        </span>
        <h1 className="text-3xl font-black text-white">Partidos Disponibles</h1>
        <p className="text-xs text-slate-400">
          Encuentra la cancha ideal adaptada a tus días, horarios y preferencias.
        </p>
      </div>

      {todosLosTurnos.length === 0 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-12 text-center text-slate-400">
          <p className="text-base font-bold text-white">No hay partidos ni turnos disponibles en la BD.</p>
          <p className="text-xs text-slate-500 mt-1">
            Configura disponibilidades en tus canchas (asegurándote de que "esta_ocupada" sea false) para ver los partidos aquí.
          </p>
        </div>
      ) : (
        <>
          <section className="space-y-4">
            <HeroCarousel recomendados={mejoresRecomendados} />
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 text-lg">⚡</span>
                <h2 className="text-lg font-bold text-white">
                  Próximos a jugarse (Más cercanos en tiempo)
                </h2>
              </div>
              <span className="text-xs text-slate-400 hidden sm:block">Desliza para ver más →</span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700">
              {masCercanosEnTiempo.map((item) => (
                <TarjetaPartido key={item.id_disponibilidad} item={item} />
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-blue-400 text-lg">📅</span>
              <h2 className="text-lg font-bold text-white">
                Partidos en tus Días Preferidos ({perfil.dias_preferidos.join(", ")})
              </h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700">
              {porDiasPreferidos.map((item) => (
                <TarjetaPartido key={item.id_disponibilidad} item={item} />
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-purple-400 text-lg">⏰</span>
              <h2 className="text-lg font-bold text-white">
                Partidos en tus Horarios Preferidos ({perfil.hora_inicio_preferida} - {perfil.hora_fin_preferida})
              </h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700">
              {porHorariosPreferidos.map((item) => (
                <TarjetaPartido key={item.id_disponibilidad} item={item} />
              ))}
            </div>
          </section>

          <section className="space-y-8 pt-4 border-t border-slate-800">
            <h2 className="text-xl font-extrabold text-white">🗓️ Partidos Organizados por Día</h2>
            {diasSemana.map((dia) => {
              const turnosDelDia = todosLosTurnos.filter(
                (t) => (t.dia_semana || "").toLowerCase() === dia.toLowerCase()
              );

              if (turnosDelDia.length === 0) return null;

              return (
                <div key={dia} className="space-y-3">
                  <h3 className="text-md font-bold text-amber-500 uppercase tracking-wide">{dia}</h3>
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700">
                    {turnosDelDia.map((item) => (
                      <TarjetaPartido key={item.id_disponibilidad} item={item} />
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        </>
      )}
    </div>
  );
}

function HeroCarousel({ recomendados }: { recomendados: DisponibilidadCancha[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (recomendados.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % recomendados.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [recomendados]);

  if (!recomendados || recomendados.length === 0) return null;

  const actual = recomendados[index];
  const cancha = actual.cancha;
  const imagenMostrar =
    cancha?.imagen ||
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80";

  return (
    <div className="relative w-full overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
      <div className="relative h-[380px] sm:h-[440px] w-full">
        <img
          src={imagenMostrar}
          alt={cancha?.nombre || "Cancha"}
          className="h-full w-full object-cover transition-all duration-700 ease-in-out"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/50 to-transparent" />

        <div className="absolute bottom-0 left-0 z-20 p-6 sm:p-10 max-w-2xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-amber-500/20 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-amber-400 border border-amber-500/30 backdrop-blur-md">
              ⭐ Recomendado Ideal
            </span>
            <span className="rounded-md bg-blue-500/20 px-2.5 py-1 text-[11px] font-bold text-blue-400 border border-blue-500/30 backdrop-blur-md">
              ⭐ {cancha?.calificacion || "4.8"} / 5.0
            </span>
            <span className="rounded-md bg-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-400 border border-emerald-500/30 backdrop-blur-md">
              📍 {cancha?.distancia_km ? `${cancha.distancia_km} km de ti` : "Cerca de tu ubicación"}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-none">
            {cancha?.nombre || "Cancha Deportiva"}
          </h1>

          <p className="text-sm sm:text-base font-semibold text-slate-300">
            {actual.dia_semana} • Horario: {actual.hora_inicio?.substring(0, 5)} - {actual.hora_fin?.substring(0, 5)} hs
          </p>

          <p className="text-xs text-slate-400 line-clamp-1">
            📍 {cancha?.ubicacion || "Santa Cruz, Bolivia"}
          </p>

          <div className="flex items-center gap-4 pt-3">
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Precio / Turno</span>
              <span className="text-xl font-black text-white">
                Bs. {cancha?.precio || "--"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => alert(`Uniéndose al turno ID: ${actual.id_disponibilidad}`)}
              className="rounded-xl bg-[#f95721] px-6 py-3 text-xs sm:text-sm font-extrabold text-white transition hover:bg-[#e04816] active:scale-95 shadow-lg shadow-[#f95721]/30"
            >
              Unirse ahora
            </button>
          </div>
        </div>

        <div className="absolute bottom-4 right-6 z-30 flex gap-2">
          {recomendados.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === idx ? "w-8 bg-[#f95721]" : "w-2 bg-slate-600/60 hover:bg-slate-400"
              }`}
              aria-label={`Ver recomendación ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TarjetaPartido({
  item,
  destacada = false,
}: {
  item: DisponibilidadCancha;
  destacada?: boolean;
}) {
  const formatearHora = (hora: string) => (hora ? hora.substring(0, 5) : "--:--");
  
  const imagenMostrar =
    item.cancha?.imagen ||
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=600&q=80";

  // Datos simulados si aún no vienen de la base de datos
  const inscritos = item.jugadores_inscritos ?? 11;
  const maximo = item.max_jugadores ?? 14;
  const porcentaje = Math.min(Math.round((inscritos / maximo) * 100), 100);

  return (
    <div
      className={`min-w-[320px] max-w-[320px] flex-shrink-0 flex flex-col justify-between rounded-2xl border ${
        destacada
          ? "border-amber-500/50 bg-slate-900 shadow-amber-500/10"
          : "border-slate-800 bg-slate-900/90"
      } p-4 shadow-xl transition hover:border-slate-700`}
    >
      <div className="space-y-3">
        <div className="relative h-36 w-full overflow-hidden rounded-xl bg-slate-800">
          <img
            src={imagenMostrar}
            alt={item.cancha?.nombre || "Cancha"}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10" />
          
          <div className="absolute top-2 right-2 z-20 flex items-center gap-1 rounded-lg bg-black/70 px-2 py-0.5 text-[10px] font-bold text-emerald-400 backdrop-blur-md border border-emerald-500/30">
            {item.cancha?.tipo_juego || "Fútbol"}
          </div>
          
          <div className="absolute bottom-2 left-2 z-20 text-[10px] font-semibold text-slate-300">
            📍 {item.cancha?.ubicacion || "Sin ubicación registrada"}
          </div>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
            {item.dia_semana}
          </span>
          <h3 className="text-base font-extrabold text-white truncate">
            {item.cancha?.nombre || `Cancha #${item.id_cancha}`}
          </h3>
          <p className="text-sm font-bold text-emerald-400 mt-1">
            ⏰ {formatearHora(item.hora_inicio)} - {formatearHora(item.hora_fin)} hs
          </p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
        <div>
          <span className="block text-[9px] uppercase font-bold text-slate-500">Precio / turno</span>
          <span className="text-sm font-black text-amber-500">
            Bs. {item.cancha?.precio || "--"}
          </span>
        </div>

        {/* BARRA DE PROGRESO CON ÍCONO DE PERSONAS */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          {/* Icono del grupo de usuarios */}
          <div className="flex -space-x-1 text-amber-500">
            <svg
              className="w-5 h-5 fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
          </div>

          {/* Barra Naranja de Progreso */}
          <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-[#f95721] rounded-full transition-all duration-500"
              style={{ width: `${porcentaje}%` }}
            />
          </div>

          {/* Texto de cupos */}
          <span className="text-xs font-bold text-slate-200">
            {inscritos}-{maximo}
          </span>
        </div>
      </div>
    </div>
  );
}