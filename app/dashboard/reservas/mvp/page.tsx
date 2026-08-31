"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/app/lib/supabase/client";

interface JugadorInfo {
  id_usuario: number;
  nombre: string;
  apellido: string;
  apodo?: string;
  correo?: string;
  esReal?: boolean;
}

interface Inscripcion {
  id_inscripcion: number;
  id_partido: number;
  id_jugador: string;
  equipo: string;
  usuario?: JugadorInfo;
  votos_recibidos?: number;
}

interface DetallePartido {
  id_partido: number;
  fecha: string;
  disponibilidaddecancha?: {
    hora_inicio: string;
    hora_fin: string;
    dia_semana: string;
    cancha?: {
      nombre: string;
      ubicacion: string;
      imagen?: string;
    };
  };
}

interface Voto {
  id_voto: number;
  id_partido: number;
  id_votante: number;
  id_votado: number;
}

export default function MVPPage() {
  const searchParams = useSearchParams();
  const idPartidoParam = searchParams.get("id_partido");
  const idPartido = idPartidoParam ? Number(idPartidoParam) : null;

  const supabase = createClient();

  const [partido, setPartido] = useState<DetallePartido | null>(null);
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [votos, setVotos] = useState<Voto[]>([]);
  const [idUsuarioActual, setIdUsuarioActual] = useState<number | null>(null);
  const [votoEmitido, setVotoEmitido] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState<string>("");

  const cargarDatosPartido = useCallback(async () => {
    if (!idPartido) return;
    setLoading(true);

    try {
      // 1. Obtener usuario autenticado actual desde Auth
      const { data: userAuth } = await supabase.auth.getUser();
      const currentUser = userAuth?.user;

      // 2. Obtener lista de usuarios registrados
      const { data: todosLosUsuarios } = await supabase
        .from("usuario")
        .select("id_usuario, nombre, apellido, apodo, correo, auth_id");

      if (currentUser && todosLosUsuarios) {
        const miUsuario = todosLosUsuarios.find(
          (u) =>
            u.auth_id === currentUser.id ||
            (u.correo && u.correo.toLowerCase() === currentUser.email?.toLowerCase())
        );
        if (miUsuario) {
          setIdUsuarioActual(miUsuario.id_usuario);
        }
      }

      // 3. Obtener detalles del partido
      const { data: partidoData, error: partidoError } = await supabase
        .from("partido")
        .select(`
          id_partido,
          fecha,
          disponibilidaddecancha (
            hora_inicio,
            hora_fin,
            dia_semana,
            cancha (
              nombre,
              ubicacion,
              imagen
            )
          )
        `)
        .eq("id_partido", idPartido)
        .single();

      if (partidoError) throw partidoError;
      setPartido(partidoData as unknown as DetallePartido);

      // 4. Obtener inscripciones del partido
      const { data: inscripcionesData, error: inscError } = await supabase
        .from("inscripcionpartido")
        .select(`
          id_inscripcion,
          id_partido,
          id_jugador,
          equipo
        `)
        .eq("id_partido", idPartido);

      if (inscError) throw inscError;

      // 5. Mapear inscripciones asociando perfil o generando fallback accesible
      const inscripcionesConUsuario: Inscripcion[] = (inscripcionesData || []).map(
        (insc, index) => {
          let usrEncontrado = todosLosUsuarios?.find(
            (u) =>
              (u.auth_id && u.auth_id === insc.id_jugador) ||
              u.id_usuario === Number(insc.id_jugador)
          );

          if (
            !usrEncontrado &&
            currentUser &&
            insc.id_jugador === currentUser.id
          ) {
            usrEncontrado = todosLosUsuarios?.find(
              (u) =>
                u.correo?.toLowerCase() === currentUser.email?.toLowerCase()
            );
          }

          const perfilAsignado: JugadorInfo = usrEncontrado
            ? {
                id_usuario: usrEncontrado.id_usuario,
                nombre: usrEncontrado.nombre,
                apellido: usrEncontrado.apellido,
                apodo: usrEncontrado.apodo,
                correo: usrEncontrado.correo,
                esReal: true,
              }
            : {
                id_usuario:
                  !isNaN(Number(insc.id_jugador)) && Number(insc.id_jugador) > 0
                    ? Number(insc.id_jugador)
                    : index + 1000,
                nombre: "Jugador",
                apellido: `#${String(insc.id_jugador).substring(0, 5)}`,
                esReal: true, // Permitir votación aun cuando el perfil se esté sincronizando
              };

          return {
            ...insc,
            usuario: perfilAsignado,
          };
        }
      );

      setInscripciones(inscripcionesConUsuario);

      // 6. Obtener votos del partido
      const { data: votosData, error: votosError } = await supabase
        .from("votomvp")
        .select("id_voto, id_partido, id_votante, id_votado")
        .eq("id_partido", idPartido);

      if (!votosError && votosData) {
        setVotos(votosData as Voto[]);
      }
    } catch (err) {
      console.error("Error al cargar datos del partido:", err);
    } finally {
      setLoading(false);
    }
  }, [idPartido, supabase]);

  useEffect(() => {
    cargarDatosPartido();
  }, [cargarDatosPartido]);

  // Verificar si el usuario actual ya votó
  useEffect(() => {
    if (idUsuarioActual && votos.length > 0) {
      const miVoto = votos.find((v) => v.id_votante === idUsuarioActual);
      if (miVoto) {
        setVotoEmitido(miVoto.id_votado);
      }
    }
  }, [idUsuarioActual, votos]);

  async function emitirVoto(idVotado: number, esReal?: boolean) {
    if (!idPartido) return;

    if (!idVotado || idVotado <= 0) {
      setMensaje("El jugador seleccionado no posee un perfil válido.");
      return;
    }

    if (esReal === false) {
      setMensaje(
        "No se puede votar por un jugador que no está registrado en el sistema."
      );
      return;
    }

    if (!idUsuarioActual) {
      setMensaje("Debes iniciar sesión para votar.");
      return;
    }

    if (votoEmitido) {
      setMensaje("Ya has emitido tu voto para este partido.");
      return;
    }

    try {
      const { error } = await supabase.from("votomvp").insert({
        id_partido: idPartido,
        id_votante: idUsuarioActual,
        id_votado: idVotado,
      });

      if (error) {
        console.error("Error al votar:", error.message);
        if (error.code === "23503") {
          setMensaje("El usuario seleccionado no está enlazado a la base de datos.");
        } else {
          setMensaje("Ocurrió un error al registrar tu voto.");
        }
      } else {
        setVotoEmitido(idVotado);
        setMensaje("¡Tu voto ha sido registrado exitosamente!");
        cargarDatosPartido();
      }
    } catch (err) {
      console.error("Error al enviar voto:", err);
    }
  }

  // Filtrado por equipos
  const equipoA = inscripciones.filter((i) => {
    const eq = (i.equipo || "").trim().toLowerCase();
    return eq === "equipo 1" || eq === "1" || eq === "a" || eq === "equipo a";
  });

  const equipoB = inscripciones.filter((i) => {
    const eq = (i.equipo || "").trim().toLowerCase();
    return eq === "equipo 2" || eq === "2" || eq === "b" || eq === "equipo b";
  });

  const inscripcionesSinCategorizar = inscripciones.filter(
    (i) => !equipoA.includes(i) && !equipoB.includes(i)
  );

  // Conteo global de votos
  const conteoVotos: Record<number, number> = {};
  votos.forEach((v) => {
    conteoVotos[v.id_votado] = (conteoVotos[v.id_votado] || 0) + 1;
  });

  const votosEquipoA = equipoA.filter(
    (jugador) =>
      jugador.usuario &&
      votos.some((v) => v.id_votante === jugador.usuario?.id_usuario)
  ).length;

  const votosEquipoB = equipoB.filter(
    (jugador) =>
      jugador.usuario &&
      votos.some((v) => v.id_votante === jugador.usuario?.id_usuario)
  ).length;

  const votacionAbierta = votosEquipoA < 3 || votosEquipoB < 3;

  let mvpJugador: JugadorInfo | null = null;
  let maxVotos = 0;

  if (!votacionAbierta && votos.length > 0) {
    Object.entries(conteoVotos).forEach(([idStr, numVotos]) => {
      if (numVotos > maxVotos) {
        maxVotos = numVotos;
        const idUsr = Number(idStr);
        const jugadorEncontrado = inscripciones.find(
          (i) => i.usuario?.id_usuario === idUsr
        )?.usuario;
        if (jugadorEncontrado) {
          mvpJugador = jugadorEncontrado;
        }
      }
    });
  }

  if (loading) {
    return (
      <div
        className="flex h-64 items-center justify-center text-sm font-bold"
        style={{ color: "var(--accent)" }}
      >
        Cargando detalles del partido...
      </div>
    );
  }

  if (!partido) {
    return (
      <div className="p-8 text-center" style={{ color: "var(--foreground)" }}>
        <p className="text-lg font-bold">
          No se encontró el partido especificado.
        </p>
        <Link
          href="/dashboard/reservas"
          className="mt-4 inline-block text-xs text-emerald-500 underline"
        >
          ← Volver a mis partidos
        </Link>
      </div>
    );
  }

  const disp = partido.disponibilidaddecancha;
  const cancha = disp?.cancha;

  const formatearFecha = (fechaStr?: string) => {
    if (!fechaStr) return "";
    const parts = fechaStr.split("T")[0].split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return new Date(fechaStr).toLocaleDateString();
  };

  return (
    <div
      className="mx-auto max-w-5xl space-y-8 p-4 sm:p-6"
      style={{ color: "var(--foreground)" }}
    >
      <Link
        href="/dashboard/reservas"
        className="inline-flex items-center gap-2 text-xs font-bold"
        style={{ color: "var(--muted)" }}
      >
        ← Volver a Mis Partidos
      </Link>

      <div
        className="relative overflow-hidden rounded-3xl border p-6 shadow-xl sm:p-8"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: "var(--accent)" }}
            >
              {disp?.dia_semana || "Resumen del Partido"}
            </span>
            <h1
              className="text-2xl font-black sm:text-3xl"
              style={{ color: "var(--foreground)" }}
            >
              {cancha?.nombre || `Partido #${partido.id_partido}`}
            </h1>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              📍 {cancha?.ubicacion || "Ubicación no especificada"}
            </p>
            <div className="flex flex-wrap gap-4 pt-2 text-xs font-semibold">
              <span>📅 Fecha: {formatearFecha(partido.fecha)}</span>
              <span>
                ⏰ Horario: {disp?.hora_inicio?.substring(0, 5)} -{" "}
                {disp?.hora_fin?.substring(0, 5)} hs
              </span>
            </div>
          </div>

          {cancha?.imagen && (
            <div className="relative h-32 w-full rounded-2xl overflow-hidden md:w-48">
              <Image
                src={cancha.imagen}
                alt={cancha.nombre}
                fill
                className="object-cover"
              />
            </div>
          )}
        </div>
      </div>

      <div
        className="rounded-2xl border p-6 text-center"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <h2
          className="text-xl font-black uppercase tracking-wider"
          style={{ color: "var(--warning)" }}
        >
          🏆 Jugador Valioso (MVP)
        </h2>

        {votacionAbierta ? (
          <div
            className="mt-3 space-y-1 text-xs"
            style={{ color: "var(--muted)" }}
          >
            <p className="font-bold text-amber-500">Votación en proceso...</p>
            <p>
              Requisito mínimo: al menos 3 jugadores de cada equipo deben emitir
              su voto.
            </p>
            <p className="mt-2 font-semibold">
              Votos actuales → Equipo 1:{" "}
              <span style={{ color: "var(--accent)" }}>
                {votosEquipoA}/3
              </span>{" "}
              | Equipo 2:{" "}
              <span style={{ color: "var(--accent)" }}>
                {votosEquipoB}/3
              </span>
            </p>
          </div>
        ) : mvpJugador ? (
          <div className="mt-4 space-y-2">
            <p className="text-2xl font-black text-emerald-400">
              🌟 {(mvpJugador as JugadorInfo).nombre}{" "}
              {(mvpJugador as JugadorInfo).apellido}{" "}
              {(mvpJugador as JugadorInfo).apodo
                ? `("${(mvpJugador as JugadorInfo).apodo}")`
                : ""}
            </p>
            <p className="text-xs font-bold" style={{ color: "var(--muted)" }}>
              Con un total de {maxVotos} votos otorgados por sus compañeros.
            </p>
          </div>
        ) : (
          <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
            Aún no se ha determinado un MVP con votos suficientes.
          </p>
        )}

        {mensaje && (
          <p className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs font-bold text-emerald-400">
            {mensaje}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Equipo 1 */}
        <div
          className="rounded-2xl border p-5 space-y-4"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <div
            className="border-b pb-3"
            style={{ borderColor: "var(--border)" }}
          >
            <h3
              className="text-lg font-black"
              style={{ color: "var(--accent)" }}
            >
              🔵 Equipo 1
            </h3>
            <p className="text-[11px]" style={{ color: "var(--muted)" }}>
              {equipoA.length} Jugadores registrados
            </p>
          </div>

          <div className="space-y-3">
            {equipoA.length === 0 ? (
              <p className="text-xs text-slate-400">
                No hay jugadores registrados en el Equipo 1.
              </p>
            ) : (
              equipoA.map((item) => {
                const usr = item.usuario;
                const numVotos = usr ? conteoVotos[usr.id_usuario] || 0 : 0;
                const esMiVoto = usr && votoEmitido === usr.id_usuario;

                return (
                  <div
                    key={item.id_inscripcion}
                    className="flex items-center justify-between rounded-xl border p-3"
                    style={{
                      background: "var(--surface-alt)",
                      borderColor: "var(--border)",
                    }}
                  >
                    <div>
                      <p
                        className="text-sm font-bold"
                        style={{ color: "var(--foreground)" }}
                      >
                        {usr ? `${usr.nombre} ${usr.apellido}` : "Jugador"}
                        {usr?.apodo && (
                          <span className="text-xs font-normal text-slate-400">
                            {" "}
                            ({usr.apodo})
                          </span>
                        )}
                      </p>
                      <p
                        className="text-[10px]"
                        style={{ color: "var(--muted)" }}
                      >
                        Votos: {numVotos}
                      </p>
                    </div>

                    {usr && usr.id_usuario !== idUsuarioActual && (
                      <button
                        onClick={() => emitirVoto(usr.id_usuario, usr.esReal)}
                        disabled={Boolean(votoEmitido) || !usr.esReal}
                        className="rounded-lg px-3 py-1.5 text-[11px] font-extrabold transition disabled:opacity-50"
                        style={{
                          background: esMiVoto ? "#eab308" : "var(--accent)",
                          color: "#ffffff",
                        }}
                      >
                        {esMiVoto ? "Tu Voto" : "Votar MVP"}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Equipo 2 */}
        <div
          className="rounded-2xl border p-5 space-y-4"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <div
            className="border-b pb-3"
            style={{ borderColor: "var(--border)" }}
          >
            <h3
              className="text-lg font-black"
              style={{ color: "var(--warning)" }}
            >
              🔴 Equipo 2
            </h3>
            <p className="text-[11px]" style={{ color: "var(--muted)" }}>
              {equipoB.length} Jugadores registrados
            </p>
          </div>

          <div className="space-y-3">
            {equipoB.length === 0 ? (
              <p className="text-xs text-slate-400">
                No hay jugadores registrados en el Equipo 2.
              </p>
            ) : (
              equipoB.map((item) => {
                const usr = item.usuario;
                const numVotos = usr ? conteoVotos[usr.id_usuario] || 0 : 0;
                const esMiVoto = usr && votoEmitido === usr.id_usuario;

                return (
                  <div
                    key={item.id_inscripcion}
                    className="flex items-center justify-between rounded-xl border p-3"
                    style={{
                      background: "var(--surface-alt)",
                      borderColor: "var(--border)",
                    }}
                  >
                    <div>
                      <p
                        className="text-sm font-bold"
                        style={{ color: "var(--foreground)" }}
                      >
                        {usr ? `${usr.nombre} ${usr.apellido}` : "Jugador"}
                        {usr?.apodo && (
                          <span className="text-xs font-normal text-slate-400">
                            {" "}
                            ({usr.apodo})
                          </span>
                        )}
                      </p>
                      <p
                        className="text-[10px]"
                        style={{ color: "var(--muted)" }}
                      >
                        Votos: {numVotos}
                      </p>
                    </div>

                    {usr && usr.id_usuario !== idUsuarioActual && (
                      <button
                        onClick={() => emitirVoto(usr.id_usuario, usr.esReal)}
                        disabled={Boolean(votoEmitido) || !usr.esReal}
                        className="rounded-lg px-3 py-1.5 text-[11px] font-extrabold transition disabled:opacity-50"
                        style={{
                          background: esMiVoto ? "#eab308" : "var(--accent)",
                          color: "#ffffff",
                        }}
                      >
                        {esMiVoto ? "Tu Voto" : "Votar MVP"}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {inscripcionesSinCategorizar.length > 0 && (
        <div
          className="rounded-2xl border p-5 space-y-4"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <h3 className="text-md font-bold text-slate-300">
            Otros Jugadores Inscritos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {inscripcionesSinCategorizar.map((item) => (
              <div
                key={item.id_inscripcion}
                className="flex items-center justify-between rounded-xl border p-3"
              >
                <p className="text-sm font-bold">
                  {item.usuario
                    ? `${item.usuario.nombre} ${item.usuario.apellido}`
                    : "Jugador"}{" "}
                  (Equipo: {item.equipo || "Sin asignar"})
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}