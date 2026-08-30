"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/app/lib/supabase/client";

interface Cancha {
  id_cancha: number;
  id_propietario: number;
  nombre: string;
  ubicacion: string; // Ej: https://www.google.com/maps?q=-17.7833,-63.1821
  direccion_texto?: string; // Ej: Calle Andres Ibañez, frente a la corte electoral
  tipo_juego: string;
  precio: number;
  imagen: string;
  estado: string;
  calificacion?: number;
  distanciaKm?: number;
  // Campos para control de jugadores y horarios
  jugadores_actuales?: number;
  max_jugadores?: number;
  hora_inicio?: string;
  hora_fin?: string;
}

export default function JugadorDashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de Geolocalización
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Carrusel
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 1. Verificar sesión activa al cargar
  useEffect(() => {
    const sessionString = localStorage.getItem("userSession");
    if (!sessionString) {
      router.replace("/login");
    }
  }, [router]);

  // 2. Extraer latitud y longitud de diferentes formatos de URL de Google Maps
  const extraerCoordsDeUrl = (url: string) => {
    if (!url) return null;

    const regexStandard = /(?:q=|@)(-?\d+\.\d+),\s*(-?\d+\.\d+)/;
    const matchStandard = url.match(regexStandard);
    if (matchStandard) {
      return {
        lat: parseFloat(matchStandard[1]),
        lng: parseFloat(matchStandard[2]),
      };
    }

    const regexDirect = /(-?\d+\.\d+),\s*(-?\d+\.\d+)/;
    const matchDirect = url.match(regexDirect);
    if (matchDirect) {
      return {
        lat: parseFloat(matchDirect[1]),
        lng: parseFloat(matchDirect[2]),
      };
    }

    return null;
  };

  // 3. Cálculo de distancia en KM mediante fórmula Haversine
  const calcularDistancia = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(1));
  };

  // 4. Solicitar permiso GPS al navegador
  const pedirUbicacion = () => {
    if (!navigator.geolocation) {
      setGeoError("Tu navegador no soporta geolocalización.");
      return;
    }

    setLoadingLocation(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLoadingLocation(false);
      },
      (error) => {
        setLoadingLocation(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGeoError("Permiso de ubicación denegado. Actívalo en los ajustes de tu navegador.");
        } else {
          setGeoError("No se pudo obtener tu ubicación actual.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    pedirUbicacion();
    cargarCanchas();

    const canalRealtime = supabase
      .channel("canchas-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cancha" },
        () => cargarCanchas()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalRealtime);
    };
  }, []);

  async function cargarCanchas() {
    setLoading(true);
    const { data, error } = await supabase
      .from("cancha")
      .select("*")
      .eq("estado", "Verificada");

    if (error) {
      console.error("Error al cargar canchas:", error);
    } else if (data) {
      const formatted = data.map((item, idx) => ({
        ...item,
        calificacion: Number((4.3 + (idx % 5) * 0.15).toFixed(1)),
        // Valores por defecto si aún no existen en tu DB
        jugadores_actuales: item.jugadores_actuales ?? 11,
        max_jugadores: item.max_jugadores ?? 14,
        hora_inicio: item.hora_inicio || "16:00",
        hora_fin: item.hora_fin || "17:00",
        direccion_texto: item.direccion_texto || "Calle Andres Ibañez, frente a la corte electoral",
      }));
      setCanchas(formatted);
    }
    setLoading(false);
  }

  // 5. Mapear canchas calculando distancia y ordenándolas
  const canchasProcesadas = canchas
    .map((cancha) => {
      const coords = extraerCoordsDeUrl(cancha.ubicacion);
      let distanciaKm: number | undefined = undefined;

      if (userLocation && coords) {
        distanciaKm = calcularDistancia(
          userLocation.lat,
          userLocation.lng,
          coords.lat,
          coords.lng
        );
      }
      return { ...cancha, distanciaKm };
    })
    .sort((a, b) => {
      if (a.distanciaKm === undefined) return 1;
      if (b.distanciaKm === undefined) return -1;
      return a.distanciaKm - b.distanciaKm;
    });

  const destacadas = [...canchasProcesadas]
    .sort((a, b) => (b.calificacion || 0) - (a.calificacion || 0))
    .slice(0, 5);

  useEffect(() => {
    if (destacadas.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % destacadas.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [destacadas.length]);

  const scrollDerecha = () => scrollContainerRef.current?.scrollBy({ left: 320, behavior: "smooth" });
  const scrollIzquierda = () => scrollContainerRef.current?.scrollBy({ left: -320, behavior: "smooth" });

  const getImagenUrl = (src?: string) => {
    if (!src || src.trim() === "") {
      return "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&auto=format&fit=crop&q=60";
    }
    return src;
  };

  // Obtener fecha actual formateada (Ej: Hoy · Domingo 30 de agosto)
  const fechaHoy = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-8 text-white pb-12">
      {/* Encabezado */}
      <header className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-md">
        <h1 className="text-3xl font-black text-white flex items-center gap-2">
          ⚽ Panel del Jugador
        </h1>
        <p className="text-sm font-medium text-slate-400 mt-1">
          Encuentra tu cancha ideal, revisa las mejor valoradas y reserva en segundos.
        </p>
      </header>

      {/* Banner de Estado GPS */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-white/10 p-4 rounded-2xl">
        <div className="text-xs">
          {loadingLocation ? (
            <span className="text-amber-400 font-semibold animate-pulse flex items-center gap-2">
              📡 Solicitando permiso de ubicación...
            </span>
          ) : userLocation ? (
            <span className="text-emerald-400 font-semibold flex items-center gap-2">
              🎯 Ubicación obtenida. Canchas ordenadas por cercanía.
            </span>
          ) : (
            <span className="text-slate-400">
              Activa tu ubicación para calcular los kilómetros exactos a cada cancha.
            </span>
          )}
          {geoError && <p className="text-red-400 mt-1">{geoError}</p>}
        </div>

        {!userLocation && (
          <button
            onClick={pedirUbicacion}
            className="text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-2 rounded-xl transition"
          >
            Activar Ubicación
          </button>
        )}
      </div>

      {/* 🌟 1. CANCHAS DESTACADAS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-amber-400 flex items-center gap-2">
            ⭐ Canchas Destacadas del Mes
          </h2>
          <span className="text-xs text-slate-400">Top 5 mejor valoradas</span>
        </div>

        {loading ? (
          <div className="h-72 w-full animate-pulse rounded-3xl bg-slate-800/60" />
        ) : destacadas.length > 0 ? (
          <div className="relative h-80 sm:h-96 w-full overflow-hidden rounded-3xl bg-slate-900 shadow-2xl border border-white/10 group">
            <div className="absolute inset-0 flex transition-transform duration-700 ease-in-out">
              <img
                src={getImagenUrl(destacadas[currentIndex]?.imagen)}
                alt={destacadas[currentIndex]?.nombre}
                className="absolute right-0 top-0 h-full w-full sm:w-2/3 object-cover object-center filter brightness-90"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=1200&auto=format&fit=crop&q=80";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent sm:w-3/4" />
            </div>

            <div className="relative z-10 flex h-full flex-col justify-between p-6 sm:p-10 max-w-lg">
              <div className="space-y-2">
                <span className="inline-block rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-400 border border-amber-500/30">
                  ★ {destacadas[currentIndex]?.calificacion} / 5.0 Destacada
                </span>
                <h3 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                  {destacadas[currentIndex]?.nombre}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300">
                  ⚽ {destacadas[currentIndex]?.tipo_juego} | 💰 Bs. {destacadas[currentIndex]?.precio} / hr
                </p>
                {destacadas[currentIndex]?.distanciaKm !== undefined && (
                  <p className="text-xs font-bold text-emerald-400">
                    📍 A {destacadas[currentIndex]?.distanciaKm} km de ti
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={destacadas[currentIndex]?.ubicacion || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-emerald-500 px-6 py-3 text-xs font-black text-slate-950 hover:bg-emerald-400 transition"
                >
                  Ver en Google Maps
                </a>
              </div>
            </div>

            <div className="absolute bottom-4 right-6 z-20 flex gap-2">
              {destacadas.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2.5 rounded-full transition-all ${
                    idx === currentIndex ? "w-8 bg-emerald-400" : "w-2.5 bg-white/40 hover:bg-white"
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white/5 p-6 text-center text-xs text-slate-400">
            No hay canchas verificadas para mostrar.
          </div>
        )}
      </section>

      {/* 📍 2. CANCHAS CERCANAS (CARRUSEL HORIZONTAL POR DISTANCIA) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">📍 Canchas Cercanas a tu Ubicación</h2>
            <p className="text-xs text-slate-400">Ordenadas de la más cercana a la más lejana</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={scrollIzquierda}
              className="rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 transition"
            >
              ❮
            </button>
            <button
              onClick={scrollDerecha}
              className="rounded-full bg-emerald-500/20 border border-emerald-500/40 p-2.5 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition"
            >
              ❯
            </button>
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-4"
          style={{ scrollbarWidth: "none" }}
        >
          {canchasProcesadas.map((cancha) => (
            <div
              key={cancha.id_cancha}
              className="min-w-[260px] sm:min-w-[300px] max-w-[300px] flex-shrink-0 rounded-2xl bg-white/5 border border-white/10 overflow-hidden hover:border-emerald-500/50 transition flex flex-col justify-between"
            >
              <div className="relative h-40 w-full bg-slate-800">
                <img
                  src={getImagenUrl(cancha.imagen)}
                  alt={cancha.nombre}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600&auto=format&fit=crop&q=60";
                  }}
                />
                <span className="absolute top-2 right-2 rounded-lg bg-slate-950/80 px-2 py-1 text-[10px] font-bold text-amber-400">
                  ★ {cancha.calificacion}
                </span>
              </div>

              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-white text-base truncate">{cancha.nombre}</h3>
                  <p className="text-xs text-slate-400 mt-1">⚽ {cancha.tipo_juego}</p>
                  <p className="text-xs font-semibold text-emerald-400 mt-0.5">
                    Bs. {cancha.precio} / hr
                  </p>
                  <div className="mt-2">
                    {cancha.distanciaKm !== undefined ? (
                      <span className="inline-block bg-emerald-500/20 text-emerald-400 text-[11px] font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                        📍 A {cancha.distanciaKm} km
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500">Distancia no calculada</span>
                    )}
                  </div>
                </div>

                <a
                  href={cancha.ubicacion}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-center block rounded-xl bg-white/10 hover:bg-emerald-600 text-xs font-bold py-2 transition text-slate-200"
                >
                  Ver Mapa
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 📋 3. TODAS LAS CANCHAS DISPONIBLES (TARJETAS ESTILO FIGMA / MOSTRADAS EN LA IMAGEN) */}
      <section className="space-y-4 pt-4 border-t border-white/10">
        <div>
          {/* Cabecera del día */}
          <div className="inline-block border-b-2 border-[#f95721] pb-1 mb-2">
            <h2 className="text-lg font-bold text-white capitalize">
              Hoy · {fechaHoy}
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Selecciona una cancha o unite a un partido en curso
          </p>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 animate-pulse">Cargando canchas...</p>
        ) : canchasProcesadas.length === 0 ? (
          <div className="rounded-2xl bg-white/5 p-8 text-center text-xs text-slate-400">
            No hay canchas con estado "Verificada" en la base de datos.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {canchasProcesadas.map((cancha) => {
              const actuales = cancha.jugadores_actuales ?? 0;
              const maximos = cancha.max_jugadores ?? 14;
              const porcentaje = Math.min(Math.round((actuales / maximos) * 100), 100);

              return (
                <div
                  key={cancha.id_cancha}
                  className="bg-[#1c1f22] border border-white/5 rounded-2xl p-4 flex gap-4 items-center text-white hover:border-[#f95721]/40 transition cursor-pointer"
                  onClick={() => alert(`Reservar o unirse a: ${cancha.nombre}`)}
                >
                  {/* Imagen cuadrada a la izquierda */}
                  <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex-shrink-0 rounded-xl overflow-hidden bg-slate-800">
                    <img
                      src={getImagenUrl(cancha.imagen)}
                      alt={cancha.nombre}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600&auto=format&fit=crop&q=60";
                      }}
                    />
                    {cancha.distanciaKm !== undefined && (
                      <span className="absolute bottom-1 left-1 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-bold text-emerald-400">
                        📍 {cancha.distanciaKm} km
                      </span>
                    )}
                  </div>

                  {/* Detalle y Métricas a la derecha */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    {/* Título */}
                    <h3 className="text-base sm:text-lg font-bold text-white leading-tight truncate">
                      {cancha.nombre}
                    </h3>

                    {/* Dirección */}
                    <div className="flex items-start gap-1.5 text-xs text-slate-400">
                      <span className="text-[#f95721] text-sm leading-none mt-0.5">📍</span>
                      <span className="line-clamp-1">
                        {cancha.direccion_texto || "Dirección no especificada"}
                      </span>
                    </div>

                    {/* Deporte */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <span className="text-[#f95721] text-sm leading-none">🏟️</span>
                      <span>{cancha.tipo_juego || "Fútbol"}</span>
                    </div>

                    {/* Rango de Horario */}
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold pt-0.5">
                      <span className="text-[#f95721] text-base leading-none">🕒</span>
                      <span>
                        <strong className="text-white font-bold text-sm sm:text-base">
                          {cancha.hora_inicio || "16:00"}
                        </strong>
                        <span className="text-slate-400 font-normal">
                          {" "}— {cancha.hora_fin || "17:00"}hs
                        </span>
                      </span>
                    </div>

                    {/* Precio y Progreso de Jugadores Registrados */}
                    <div className="flex items-center justify-between pt-1">
                      {/* Precio */}
                      <div className="flex items-baseline gap-1">
                        <span className="text-[#f95721] font-bold text-xs sm:text-sm">Bs</span>
                        <span className="text-white font-bold text-base sm:text-lg">
                          {cancha.precio ? Number(cancha.precio).toFixed(2) : "0.00"}
                        </span>
                      </div>

                      {/* Contador de Jugadores + Barra */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#f95721] text-base leading-none">👥</span>
                        <div className="w-12 sm:w-16 h-2 bg-slate-700/60 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#f95721] rounded-full transition-all duration-300"
                            style={{ width: `${porcentaje}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-300">
                          {actuales}-{maximos}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}