"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/app/lib/supabase/client";
import NotificationBell from "@/app/components/NotificationBell";

interface UserProfile {
  id_usuario: number;
  nombre: string;
  apellido: string;
  correo: string;
  apodo?: string | null;
  posicion_juego?: string;
  dias_preferencia?: string;
  turno_preferencia?: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function loadUserSession() {
      try {
        const sessionString = localStorage.getItem("userSession");
        if (!sessionString) {
          router.push("/login");
          return;
        }

        const session = JSON.parse(sessionString);
        if (!session?.id_usuario) {
          router.push("/login");
          return;
        }

        const { data: usuario, error } = await supabase
          .from("usuario")
          .select("*")
          .eq("id_usuario", session.id_usuario)
          .single();

        if (error || !usuario) {
          console.error("Error al cargar usuario en el layout:", error);
          return;
        }

        setUser(usuario);
      } catch (err) {
        console.error("Error procesando sesión en layout:", err);
      }
    }

    loadUserSession();
  }, [router, supabase]);

  const handleLogout = () => {
    localStorage.removeItem("userSession");
    router.push("/login");
  };

  const nombreJugador = user?.nombre || "Jugador";
  const apellidoJugador = user?.apellido || "";
  const correoJugador = user?.correo || "";

  const inicial = user?.nombre
    ? user.nombre.charAt(0).toUpperCase()
    : "J";

  // Rutas actualizadas apuntando a la estructura del proyecto
  const navLinks = [
    { name: "⚽ Canchas", href: "/dashboard/projects" },
    { name: "📅 Mis Reservas", href: "/dashboard/reservas" },
    { name: "💬 Mensajes", href: "/dashboard/message" },
    { name: "❓ Soporte", href: "/dashboard/soporte" },
  ];

  return (
    <div className="min-h-screen bg-emerald-950/[0.02] font-sans flex flex-col">
      {/* ── BARRA DE NAVEGACIÓN SUPERIOR ── */}
      <header className="h-16 bg-emerald-950 border-b border-emerald-800/50 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-40 text-white shadow-md">
        {/* Logo que redirige al Dashboard principal */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-2xl font-black text-emerald-400 hover:text-emerald-300 transition shrink-0 tracking-tight"
        >
          ⚽ DeUna<span className="text-lime-400">!</span>
        </Link>

        {/* Botones de Navegación */}
        <nav className="hidden md:flex items-center gap-2 text-xs font-bold">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-xl transition ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-inner font-extrabold"
                    : "text-emerald-100/80 hover:bg-emerald-800/60 hover:text-white"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Notificaciones y Perfil del Usuario */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Componente de la Campanita de Notificaciones */}
          <NotificationBell />

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-emerald-800/50 transition border border-transparent hover:border-emerald-700/50"
            >
              <div className="w-9 h-9 rounded-full bg-lime-500 text-emerald-950 font-black flex items-center justify-center text-xs shadow-md">
                {inicial}
              </div>
              <div className="text-left hidden sm:block leading-tight">
                <p className="text-xs font-bold text-white capitalize">
                  {nombreJugador} {apellidoJugador}
                </p>
                <p className="text-[10px] text-emerald-300 font-medium">
                  {user?.apodo ? `"${user.apodo}"` : "Jugador"}
                </p>
              </div>
              <span className="text-[10px] text-emerald-300 ml-1">▼</span>
            </button>

            {/* Menú Desplegable */}
            {isMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-emerald-100 py-2 z-50 text-slate-800"
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="px-4 py-2 border-b border-slate-100 bg-emerald-50/50 rounded-t-2xl">
                  <p className="text-xs font-bold text-slate-800 capitalize">
                    {nombreJugador} {apellidoJugador}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {correoJugador}
                  </p>
                </div>

                <Link
                  href="/dashboard/profile"
                  className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition"
                >
                  👤 Mi Perfil
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 text-left px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition"
                >
                  🚪 Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── CONTENIDO DE LAS PÁGINAS ── */}
      <main className="p-8 space-y-8 max-w-7xl w-full mx-auto flex-1">
        {children}
      </main>
    </div>
  );
}