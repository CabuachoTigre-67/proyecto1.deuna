"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/app/lib/supabase/client";

interface Notificacion {
  id_notificacion: number;
  titulo: string;
  mensaje: string;
  leido: boolean;
  fecha_creacion: string;
}

export default function NotificationBell() {
  const supabase = createClient();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [open, setOpen] = useState(false);
  const [idUsuario, setIdUsuario] = useState<number | null>(null);

  useEffect(() => {
    const sessionString = localStorage.getItem("userSession");
    if (sessionString) {
      try {
        const session = JSON.parse(sessionString);
        if (session?.id_usuario) {
          setIdUsuario(session.id_usuario);
        }
      } catch (err) {
        console.error("Error al leer sesión:", err);
      }
    }
  }, []);

  useEffect(() => {
    if (!idUsuario) return;

    async function fetchNotificaciones() {
      const { data, error } = await supabase
        .from("notificacion")
        .select("*")
        .eq("id_usuario", idUsuario)
        .order("id_notificacion", { ascending: false });

      if (!error && data) {
        setNotificaciones(data);
      }
    }

    fetchNotificaciones();
  }, [idUsuario, supabase]);

  async function marcarComoLeida(id_notificacion: number) {
    await supabase
      .from("notificacion")
      .update({ leido: true })
      .eq("id_notificacion", id_notificacion);

    setNotificaciones((prev) =>
      prev.map((n) =>
        n.id_notificacion === id_notificacion ? { ...n, leido: true } : n
      )
    );
  }

  const noLeidas = notificaciones.filter((n) => !n.leido).length;

  return (
    <div className="relative">
      {/* Botón Campanita */}
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-full bg-slate-800 p-2.5 text-white hover:bg-slate-700 transition"
      >
        🔔
        {noLeidas > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-md">
            {noLeidas}
          </span>
        )}
      </button>

      {/* Panel Desplegable */}
      {open && (
        <div className="absolute right-0 mt-3 w-80 rounded-2xl bg-white p-4 shadow-2xl border border-slate-100 z-50 text-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900">Notificaciones</h3>
            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full font-semibold text-slate-600">
              {noLeidas} nuevas
            </span>
          </div>

          <div className="mt-3 max-h-72 overflow-y-auto space-y-2">
            {notificaciones.length === 0 ? (
              <p className="text-xs text-center py-6 text-slate-400">
                Sin notificaciones
              </p>
            ) : (
              notificaciones.map((n) => (
                <div
                  key={n.id_notificacion}
                  onClick={() => !n.leido && marcarComoLeida(n.id_notificacion)}
                  className={`p-3 rounded-xl border transition cursor-pointer text-xs ${
                    n.leido
                      ? "bg-slate-50/50 border-slate-100 text-slate-500"
                      : "bg-emerald-50/50 border-emerald-200 text-slate-900 font-medium"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-slate-900">{n.titulo}</p>
                    {!n.leido && (
                      <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    )}
                  </div>
                  <p className="mt-1 text-slate-600 text-[11px] leading-tight">
                    {n.mensaje}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}