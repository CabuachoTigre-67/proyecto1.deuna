"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/app/lib/supabase/client";

interface Usuario {
  id_usuario: number;
  nombre: string;
  apodo?: string | null;
  correo?: string;
  rol?: string;
}

interface RelacionAmistad {
  id_solicitante: number;
  id_receptor: number;
  estado: string;
}

export default function MensajesPage() {
  const supabase = createClient();

  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [amigos, setAmigos] = useState<Usuario[]>([]);
  const [solicitudes, setSolicitudes] = useState<Usuario[]>([]);
  const [relaciones, setRelaciones] = useState<RelacionAmistad[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sessionString = localStorage.getItem("userSession");
    if (!sessionString) return;

    try {
      const session = JSON.parse(sessionString);
      if (session?.id_usuario) {
        setUsuarioActual({
          id_usuario: session.id_usuario,
          nombre: session.nombre || "",
          apodo: session.apodo || null,
          correo: session.correo || "",
          rol: session.rol || "",
        });
      }
    } catch (err) {
      console.error("Error al leer sesión:", err);
    }
  }, []);

  useEffect(() => {
    if (!usuarioActual) return;
    cargarDatos();
  }, [usuarioActual]);

  async function cargarDatos() {
    if (!usuarioActual) return;

    setLoading(true);

    try {
      // 1. Cargar otros usuarios
      const { data: usuariosData, error: errorUsuarios } = await supabase
        .from("usuario")
        .select("id_usuario, nombre, apodo, correo, rol")
        .neq("id_usuario", usuarioActual.id_usuario)
        .order("apodo", { ascending: true });

      if (errorUsuarios) {
        console.error("Error cargando usuarios:", errorUsuarios);
      }

      // 2. Cargar relaciones de amistad
      const { data: relacionesData, error: errorAmistad } = await supabase
        .from("amistad")
        .select("id_solicitante, id_receptor, estado")
        .or(
          `id_solicitante.eq.${usuarioActual.id_usuario},id_receptor.eq.${usuarioActual.id_usuario}`
        );

      if (errorAmistad) {
        console.error("Error cargando amistades:", errorAmistad);
      }

      const listaUsuarios = usuariosData || [];
      const listaRelaciones = (relacionesData as RelacionAmistad[]) || [];

      const amigosMap = new Map<number, Usuario>();
      const solicitudesMap = new Map<number, Usuario>();

      listaRelaciones.forEach((rel) => {
        const otroUsuarioId =
          rel.id_solicitante === usuarioActual.id_usuario
            ? rel.id_receptor
            : rel.id_solicitante;

        const usuarioRelacionado = listaUsuarios.find(
          (u) => u.id_usuario === otroUsuarioId
        );

        if (!usuarioRelacionado) return;

        // Amistad confirmada
        if (rel.estado === "Aceptada") {
          amigosMap.set(otroUsuarioId, usuarioRelacionado);
        }

        // Solicitud pendiente recibida por el usuario actual
        if (
          rel.estado === "Pendiente" &&
          rel.id_receptor === usuarioActual.id_usuario
        ) {
          solicitudesMap.set(otroUsuarioId, usuarioRelacionado);
        }
      });

      setUsuarios(listaUsuarios);
      setRelaciones(listaRelaciones);
      setAmigos(Array.from(amigosMap.values()));
      setSolicitudes(Array.from(solicitudesMap.values()));
    } finally {
      setLoading(false);
    }
  }

  async function enviarSolicitudAmistad(idReceptor: number) {
    if (!usuarioActual) return;

    const { error } = await supabase.from("amistad").insert({
      id_solicitante: usuarioActual.id_usuario,
      id_receptor: idReceptor,
      estado: "Pendiente",
    });

    if (error) {
      alert("No se pudo enviar la solicitud: " + error.message);
      return;
    }

    await cargarDatos();
  }

  async function aceptarSolicitud(idSolicitante: number) {
    if (!usuarioActual) return;

    const { error } = await supabase
      .from("amistad")
      .update({ estado: "Aceptada" })
      .eq("id_solicitante", idSolicitante)
      .eq("id_receptor", usuarioActual.id_usuario);

    if (error) {
      alert("No se pudo aceptar la solicitud: " + error.message);
      return;
    }

    await cargarDatos();
  }

  const usuariosFiltrados = usuarios.filter((user) => {
    const nombre = (user.apodo || user.nombre || "").toLowerCase();
    return nombre.includes(busqueda.trim().toLowerCase());
  });

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl">
        <header className="border-b border-slate-200 bg-gradient-to-r from-emerald-600 to-green-500 px-5 py-5 text-white">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-100">
                DeUna!
              </p>
              <h1 className="text-2xl font-black">Jugadores</h1>
            </div>
            <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
              {amigos.length} amigos
            </div>
          </div>
        </header>

        <div className="grid gap-0 lg:grid-cols-[340px_1fr]">
          <aside className="border-b border-slate-200 bg-slate-50 p-4 lg:border-b-0 lg:border-r">
            <div className="mb-4">
              <h2 className="text-sm font-black text-slate-800">Amigos</h2>
            </div>

            <div className="space-y-3">
              {amigos.length === 0 ? (
                <p className="text-xs text-slate-500">Todavía no tienes amigos.</p>
              ) : (
                amigos.map((amigo) => (
                  <div
                    key={amigo.id_usuario}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700">
                        {(amigo.apodo || amigo.nombre || "J").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          {amigo.apodo || amigo.nombre}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {amigo.rol || "Jugador"}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                      Amigo
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6">
              <h3 className="mb-3 text-sm font-black text-slate-800">Solicitudes</h3>
              <div className="space-y-3">
                {solicitudes.length === 0 ? (
                  <p className="text-xs text-slate-500">No tienes solicitudes pendientes.</p>
                ) : (
                  solicitudes.map((usuario) => (
                    <div
                      key={usuario.id_usuario}
                      className="rounded-2xl border border-amber-200 bg-amber-50 p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            {usuario.apodo || usuario.nombre}
                          </p>
                          <p className="text-[10px] text-slate-500">Quiere agregarte</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => aceptarSolicitud(usuario.id_usuario)}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-emerald-700"
                        >
                          Aceptar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>

          <main className="p-4 sm:p-6">
            <div className="mb-5">
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                Buscar jugador
              </label>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Escribe un apodo..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white"
              />
            </div>

            {loading ? (
              <div className="flex h-28 items-center justify-center text-sm font-bold text-slate-500">
                Cargando jugadores...
              </div>
            ) : usuariosFiltrados.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                No se encontraron jugadores con ese apodo.
              </div>
            ) : (
              <div className="space-y-3">
                {usuariosFiltrados.map((user) => {
                  const yaEsAmigo = amigos.some(
                    (amigo) => amigo.id_usuario === user.id_usuario
                  );
                  
                  const relacionExistente = relaciones.find(
                    (r) =>
                      (r.id_solicitante === usuarioActual?.id_usuario &&
                        r.id_receptor === user.id_usuario) ||
                      (r.id_receptor === usuarioActual?.id_usuario &&
                        r.id_solicitante === user.id_usuario)
                  );

                  const yaEnviada =
                    relacionExistente?.id_solicitante === usuarioActual?.id_usuario &&
                    relacionExistente?.estado === "Pendiente";

                  return (
                    <div
                      key={user.id_usuario}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-sm font-black text-white">
                          {(user.apodo || user.nombre || "J").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800">
                            {user.apodo || user.nombre}
                          </p>
                          <p className="text-[11px] text-slate-500">{user.nombre}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => enviarSolicitudAmistad(user.id_usuario)}
                        disabled={yaEsAmigo || yaEnviada}
                        className={`rounded-xl px-4 py-2 text-[11px] font-bold transition ${
                          yaEsAmigo
                            ? "bg-emerald-100 text-emerald-700"
                            : yaEnviada
                              ? "bg-slate-200 text-slate-500"
                              : "bg-emerald-600 text-white hover:bg-emerald-700"
                        }`}
                      >
                        {yaEsAmigo
                          ? "Amigos"
                          : yaEnviada
                            ? "Solicitada"
                            : "Enviar solicitud"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}