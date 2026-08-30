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
      const { data } = await supabase
        .from("notificacion")
        .select("*")
        .eq("id_usuario", idUsuario)
        .order("fecha_creacion", { ascending: false });

      if (data) setNotificaciones(data);
    }

    fetchNotificaciones();
  }, [idUsuario]);

  const noLeidas = notificaciones.filter((n) => !n.leido).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-full bg-slate-800 p-2.5 text-white hover:bg-slate-700 transition"
      >
        🔔
        {noLeidas > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold">
            {noLeidas}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white p-4 shadow-2xl border border-slate-100 z-50 text-slate-800">
          <h4 className="text-sm font-bold text-slate-900 mb-3">Notificaciones</h4>
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 space-y-2">
            {notificaciones.length === 0 ? (
              <p className="text-xs text-slate-400 py-2 text-center">Sin notificaciones.</p>
            ) : (
              notificaciones.map((n) => (
                <div key={n.id_notificacion} className="pt-2 text-xs">
                  <p className="font-bold text-slate-800">{n.titulo}</p>
                  <p className="text-slate-600 mt-0.5">{n.mensaje}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}