    "use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/app/lib/supabase/client";

interface Usuario {
  id_usuario: number;
  nombre: string;
  apellido?: string;
  email: string;
}

interface Mensaje {
  id_mensaje?: number;
  id_emisor: number;
  id_receptor: number;
  mensaje: string;
  fecha_envio?: string;
}

export default function MensajesPage() {
  const supabase = createClient();

  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(null);
  const [tabActiva, setTabActiva] = useState<"chats" | "buscar">("chats");

  // Estado de Búsqueda y Amistades
  const [busqueda, setBusqueda] = useState("");
  const [usuariosEncontrados, setUsuariosEncontrados] = useState<Usuario[]>([]);
  const [solicitudEnviada, setSolicitudEnviada] = useState<number[]>([]);

  // Estado de Chats y Mensajería
  const [amigos, setAmigos] = useState<Usuario[]>([]);
  const [chatSeleccionado, setChatSeleccionado] = useState<Usuario | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [loadingMensajes, setLoadingMensajes] = useState(false);

  // 1. Cargar Sesión del Usuario
  useEffect(() => {
    const sessionString = localStorage.getItem("userSession");
    if (sessionString) {
      try {
        const session = JSON.parse(sessionString);
        if (session?.id_usuario) {
          setUsuarioActual(session);
        }
      } catch (err) {
        console.error("Error al leer sesión:", err);
      }
    }
  }, []);

  // 2. Cargar Lista de Amigos / Contactos
  useEffect(() => {
    if (!usuarioActual) return;
    cargarAmigos();
  }, [usuarioActual]);

  async function cargarAmigos() {
    if (!usuarioActual) return;

    // Consulta las conexiones aceptadas en la tabla 'amistad'
    const { data, error } = await supabase
      .from("amistad")
      .select(`
        id_usuario1,
        id_usuario2,
        usuario1:usuario!id_usuario1(id_usuario, nombre, email),
        usuario2:usuario!id_usuario2(id_usuario, nombre, email)
      `)
      .or(`id_usuario1.eq.${usuarioActual.id_usuario},id_usuario2.eq.${usuarioActual.id_usuario}`)
      .eq("estado", "Aceptado");

    if (error) {
      console.error("Error cargando amigos:", error);
      return;
    }

    if (data) {
      const listaAmigos: Usuario[] = data.map((item: any) => {
        return item.id_usuario1 === usuarioActual.id_usuario
          ? item.usuario2
          : item.usuario1;
      });
      setAmigos(listaAmigos);
    }
  }

  // 3. Buscar Jugadores para enviar Solicitud
  async function handleBuscar(e: React.FormEvent) {
    e.preventDefault();
    if (!busqueda.trim() || !usuarioActual) return;

    const { data, error } = await supabase
      .from("usuario")
      .select("id_usuario, nombre, email")
      .neq("id_usuario", usuarioActual.id_usuario)
      .ilike("nombre", `%${busqueda.trim()}%`)
      .limit(10);

    if (error) {
      console.error("Error al buscar usuarios:", error);
      return;
    }

    setUsuariosEncontrados(data || []);
  }

  // 4. Enviar Solicitud de Amistad
  async function enviarSolicitudAmistad(idReceptor: number) {
    if (!usuarioActual) return;

    const { error } = await supabase.from("amistad").insert({
      id_usuario1: usuarioActual.id_usuario,
      id_usuario2: idReceptor,
      estado: "Pendiente",
    });

    if (error) {
      alert("No se pudo enviar la solicitud: " + error.message);
    } else {
      setSolicitudEnviada((prev) => [...prev, idReceptor]);
    }
  }

  // 5. Cargar Mensajes del Chat Seleccionado
  useEffect(() => {
    if (!chatSeleccionado || !usuarioActual) return;

    async function cargarMensajes() {
      setLoadingMensajes(true);
      const { data, error } = await supabase
        .from("tercertiempo")
        .select("*")
        .or(
          `and(id_emisor.eq.${usuarioActual?.id_usuario},id_receptor.eq.${chatSeleccionado?.id_usuario}),and(id_emisor.eq.${chatSeleccionado?.id_usuario},id_receptor.eq.${usuarioActual?.id_usuario})`
        )
        .order("fecha_envio", { ascending: true });

      if (error) {
        console.error("Error al obtener mensajes:", error);
      } else {
        setMensajes(data || []);
      }
      setLoadingMensajes(false);
    }

    cargarMensajes();
  }, [chatSeleccionado, usuarioActual]);

  // 6. Enviar Mensaje Directo
  async function handleEnviarMensaje(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevoMensaje.trim() || !chatSeleccionado || !usuarioActual) return;

    const payload = {
      id_emisor: usuarioActual.id_usuario,
      id_receptor: chatSeleccionado.id_usuario,
      mensaje: nuevoMensaje.trim(),
    };

    const { data, error } = await supabase
      .from("tercertiempo")
      .insert(payload)
      .select()
      .single();

    if (error) {
      alert("Error enviando el mensaje: " + error.message);
    } else if (data) {
      setMensajes((prev) => [...prev, data]);
      setNuevoMensaje("");
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl">
      {/* LATERAL IZQUIERDO: Lista de Chats / Búsqueda */}
      <div className="flex w-full flex-col border-r border-slate-200 sm:w-80 md:w-96">
        {/* Cabecera */}
        <div className="bg-slate-900 p-4 text-white">
          <h1 className="text-xl font-black">💬 Tercer Tiempo</h1>
          <p className="text-xs text-slate-400">Mensajería y comunidad de jugadores</p>

          {/* Navegación por Pestañas */}
          <div className="mt-4 flex rounded-xl bg-slate-800 p-1">
            <button
              onClick={() => setTabActiva("chats")}
              className={`w-1/2 rounded-lg py-1.5 text-xs font-bold transition ${
                tabActiva === "chats"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Chats
            </button>
            <button
              onClick={() => setTabActiva("buscar")}
              className={`w-1/2 rounded-lg py-1.5 text-xs font-bold transition ${
                tabActiva === "buscar"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              ➕ Buscar Jugadores
            </button>
          </div>
        </div>

        {/* CONTENIDO PESTAÑA CHATS */}
        {tabActiva === "chats" && (
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {amigos.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Aún no tienes contactos. ¡Busca jugadores para enviarles una solicitud de amistad!
              </div>
            ) : (
              amigos.map((amigo) => (
                <button
                  key={amigo.id_usuario}
                  onClick={() => setChatSeleccionado(amigo)}
                  className={`flex w-full items-center gap-3 p-4 text-left transition hover:bg-slate-50 ${
                    chatSeleccionado?.id_usuario === amigo.id_usuario
                      ? "bg-emerald-50/60 border-l-4 border-emerald-600"
                      : ""
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 font-bold text-white">
                    {amigo.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {amigo.nombre}
                    </p>
                    <p className="truncate text-xs text-slate-400">{amigo.email}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* CONTENIDO PESTAÑA BUSCAR JUGADORES */}
        {tabActiva === "buscar" && (
          <div className="flex-1 space-y-4 p-4 overflow-y-auto">
            <form onSubmit={handleBuscar} className="flex gap-2">
              <input
                type="text"
                placeholder="Nombre del jugador..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-600"
              />
              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
              >
                Buscar
              </button>
            </form>

            <div className="space-y-2">
              {usuariosEncontrados.map((user) => {
                const enviado = solicitudEnviada.includes(user.id_usuario);
                return (
                  <div
                    key={user.id_usuario}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">{user.nombre}</p>
                      <p className="text-[10px] text-slate-400">{user.email}</p>
                    </div>
                    <button
                      disabled={enviado}
                      onClick={() => enviarSolicitudAmistad(user.id_usuario)}
                      className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${
                        enviado
                          ? "bg-slate-200 text-slate-500"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                    >
                      {enviado ? "Enviada" : "➕ Agregar"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* LATERAL DERECHO: Ventana de Chat Activo */}
      <div className="flex flex-1 flex-col bg-slate-50">
        {chatSeleccionado ? (
          <>
            {/* Header del Chat */}
            <div className="flex items-center gap-3 border-b border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 font-bold text-white">
                {chatSeleccionado.nombre.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">
                  {chatSeleccionado.nombre}
                </h2>
                <p className="text-[10px] text-emerald-600 font-semibold">En línea</p>
              </div>
            </div>

            {/* Mensajes del Chat */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMensajes ? (
                <p className="text-center text-xs text-slate-400">Cargando conversación...</p>
              ) : mensajes.length === 0 ? (
                <p className="text-center text-xs text-slate-400">
                  Aún no hay mensajes. ¡Escribe el primer mensaje!
                </p>
              ) : (
                mensajes.map((m, idx) => {
                  const esMio = m.id_emisor === usuarioActual?.id_usuario;
                  return (
                    <div
                      key={m.id_mensaje || idx}
                      className={`flex ${esMio ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs rounded-2xl px-4 py-2.5 text-xs font-medium shadow-sm sm:max-w-md ${
                          esMio
                            ? "bg-emerald-600 text-white rounded-br-none"
                            : "bg-white text-slate-800 border border-slate-100 rounded-bl-none"
                        }`}
                      >
                        {m.mensaje}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Campo de Texto para Enviar */}
            <form
              onSubmit={handleEnviarMensaje}
              className="flex gap-2 border-t border-slate-200 bg-white p-3"
            >
              <input
                type="text"
                placeholder="Escribe un mensaje..."
                value={nuevoMensaje}
                onChange={(e) => setNuevoMensaje(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-emerald-600"
              />
              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700"
              >
                Enviar 🚀
              </button>
            </form>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            <div className="text-4xl">⚽</div>
            <p className="mt-2 text-sm font-bold text-slate-700">Tercer Tiempo Chat</p>
            <p className="mt-1 text-xs text-slate-400">
              Selecciona un contacto a la izquierda para conversar o busca nuevos jugadores.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}