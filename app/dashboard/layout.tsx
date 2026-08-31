"use client";

import React, { useEffect, useRef, useState } from "react";
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

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const storedTheme = localStorage.getItem("deuna-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme = storedTheme || (prefersDark ? "dark" : "light");
    const shouldDark = nextTheme === "dark";

    setIsDark(shouldDark);
    document.documentElement.setAttribute("data-theme", nextTheme);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    localStorage.setItem("deuna-theme", isDark ? "dark" : "light");
  }, [isDark]);

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

        const rol = String(usuario.rol || "").trim().toLowerCase();

        if (pathname.startsWith("/dashboard/mantenimiento") && rol !== "mantenimiento") {
          router.replace("/dashboard/jugador");
          return;
        }

        setUser(usuario);
      } catch (err) {
        console.error("Error procesando sesión en layout:", err);
      }
    }

    loadUserSession();
  }, [router, supabase, pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setIsProfileMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        setIsMobileNavOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userSession");
    localStorage.setItem("deuna-theme", "light");
    document.documentElement.setAttribute("data-theme", "light");
    document.documentElement.style.colorScheme = "light";
    setIsDark(false);
    setIsProfileMenuOpen(false);
    setIsMobileNavOpen(false);
    router.push("/login");
  };

  const nombreJugador = user?.nombre || "Jugador";
  const apellidoJugador = user?.apellido || "";
  const correoJugador = user?.correo || "";

  const inicial = user?.nombre
    ? user.nombre.charAt(0).toUpperCase()
    : "J";

  const navLinks = [
    { name: "⚽ Canchas", href: "/dashboard/projects" },
    { name: "📅 Mis Reservas", href: "/dashboard/reservas" },
    { name: "💬 Mensajes", href: "/dashboard/message" },
  ];

  const headerStyle = isDark
    ? {
        background: "rgba(8, 22, 15, 0.88)",
        borderColor: "rgba(148, 163, 184, 0.18)",
        boxShadow: "0 10px 25px rgba(2, 6, 23, 0.38)",
      }
    : {
        background: "rgba(255, 255, 255, 0.96)",
        borderColor: "rgba(52, 215, 122, 0.22)",
        boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)",
      };

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ background: "var(--background)" }}>
      <header
        className="sticky top-0 z-40 border-b px-4 sm:px-6 lg:px-8 backdrop-blur-xl"
        style={headerStyle}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="flex shrink-0 items-center gap-2 text-xl font-black tracking-tight transition sm:text-2xl"
            style={{ color: isDark ? "#4ade80" : "#1fa85f" }}
          >
            ⚽ DeUna<span style={{ color: isDark ? "#86efac" : "#22c55e" }}>!</span>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-xl px-4 py-2 text-xs font-bold transition"
                  style={{
                    background: isActive ? (isDark ? "var(--accent)" : "#16a34a") : "transparent",
                    color: isActive ? "#ffffff" : isDark ? "var(--foreground)" : "#0f172a",
                    opacity: isActive ? 1 : 0.8,
                    boxShadow: isActive ? "0 8px 18px rgba(22,163,74,0.25)" : "none",
                  }}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              aria-label="Cambiar tema"
              onClick={() => setIsDark((prev) => !prev)}
              className="flex h-10 w-10 items-center justify-center rounded-full border text-lg transition hover:scale-105"
              style={{
                background: isDark ? "var(--card)" : "#ecfdf5",
                borderColor: isDark ? "var(--border)" : "rgba(16, 185, 129, 0.2)",
                color: isDark ? "var(--foreground)" : "#15803d",
              }}
            >
              {isDark ? "☀️" : "🌙"}
            </button>

            <NotificationBell />

            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setIsProfileMenuOpen((prev) => !prev);
                  setIsMobileNavOpen(false);
                }}
                className="flex items-center gap-2 rounded-xl border p-1.5 transition sm:gap-3"
                style={{
                  background: isDark ? "var(--card)" : "#f8fafc",
                  borderColor: isDark ? "var(--border)" : "rgba(15, 118, 110, 0.15)",
                }}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-black shadow-md" style={{ background: "#84cc16", color: "#052e16" }}>
                  {inicial}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-xs font-bold capitalize" style={{ color: isDark ? "var(--foreground)" : "#0f172a" }}>
                    {nombreJugador} {apellidoJugador}
                  </p>
                  <p className="text-[10px]" style={{ color: isDark ? "var(--muted)" : "#475569" }}>
                    {user?.apodo ? `"${user.apodo}"` : "Jugador"}
                  </p>
                </div>
                <span className="px-1 text-[10px]" style={{ color: isDark ? "var(--muted)" : "#475569" }}>▼</span>
              </button>

              {isProfileMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border py-2 shadow-2xl"
                  style={{ background: isDark ? "var(--card-strong)" : "#ffffff", borderColor: isDark ? "var(--border)" : "rgba(15, 23, 42, 0.08)" }}
                  onClick={() => setIsProfileMenuOpen(false)}
                >
                  <div className="border-b px-4 py-3" style={{ borderColor: isDark ? "var(--border)" : "rgba(15, 23, 42, 0.06)", background: isDark ? "var(--surface-alt)" : "#f0fdf4" }}>
                    <p className="text-xs font-bold capitalize" style={{ color: isDark ? "var(--foreground)" : "#0f172a" }}>
                      {nombreJugador} {apellidoJugador}
                    </p>
                    <p className="truncate text-[10px]" style={{ color: isDark ? "var(--muted)" : "#64748b" }}>
                      {correoJugador}
                    </p>
                  </div>

                  <Link
                    href="/dashboard/profile"
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition"
                    style={{ color: isDark ? "var(--foreground)" : "#0f172a" }}
                  >
                    👤 Mi Perfil
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-bold transition"
                    style={{ color: "var(--danger)" }}
                  >
                    🚪 Cerrar Sesión
                  </button>
                </div>
              )}
            </div>

            <div className="relative md:hidden" ref={mobileMenuRef}>
              <button
                type="button"
                aria-label="Abrir menú de navegación"
                onMouseEnter={() => setIsMobileNavOpen(true)}
                onMouseLeave={() => setIsMobileNavOpen(false)}
                onFocus={() => setIsMobileNavOpen(true)}
                onBlur={() => setIsMobileNavOpen(false)}
                onClick={() => setIsMobileNavOpen((prev) => !prev)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border text-lg"
                style={{
                  background: isDark ? "var(--card)" : "#f8fafc",
                  borderColor: isDark ? "var(--border)" : "rgba(15, 118, 110, 0.15)",
                  color: isDark ? "var(--foreground)" : "#0f172a",
                }}
              >
                ☰
              </button>

              {isMobileNavOpen && (
                <nav
                  className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-2xl border p-2 shadow-2xl"
                  style={{ background: isDark ? "var(--card-strong)" : "#ffffff", borderColor: isDark ? "var(--border)" : "rgba(15, 23, 42, 0.08)" }}
                  onMouseLeave={() => setIsMobileNavOpen(false)}
                >
                  <div className="flex flex-col gap-1">
                    {navLinks.map((link) => {
                      const isActive = pathname.startsWith(link.href);
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setIsMobileNavOpen(false)}
                          className="rounded-xl px-3 py-2 text-sm font-semibold"
                          style={{
                            background: isActive ? (isDark ? "var(--accent-soft)" : "#dcfce7") : "transparent",
                            color: isActive ? (isDark ? "var(--accent)" : "#166534") : isDark ? "var(--foreground)" : "#0f172a",
                          }}
                        >
                          {link.name}
                        </Link>
                      );
                    })}
                  </div>
                </nav>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}