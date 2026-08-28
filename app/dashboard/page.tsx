"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function CanchaMedia({
  cancha,
  className = "h-40",
}: {
  cancha: any;
  className?: string;
}) {
  return (
    <div
      className={`relative w-full bg-slate-700 flex items-center justify-center overflow-hidden ${className}`}
    >
      {cancha?.imagen ? (
        <img
          src={cancha.imagen}
          alt={cancha.nombre}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="text-white text-xs font-bold bg-slate-800 w-full h-full flex items-center justify-center">
          ⚽ {cancha?.nombre || "Cancha"}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();

  // Estados para el usuario y el menú desplegable superior
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>({
    nombre: "Usuario",
    apellido: "",
    correo: "",
    rol: "Jugador",
    stats: { partidos: 0, mvps: 0, reservas: 0 },
  });

  // Cargar información del usuario desde localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser((prev: any) => ({
          ...prev,
          ...parsed,
        }));
      } catch (e) {
        console.error("Error leyendo usuario de localStorage", e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    router.push("/login");
  };

  const [publishedMatches] = useState<any[]>([]);

  const canchas = [
    {
      id: "1",
      nombre: "Cancha El Río",
      ubicacion: "Equipetrol, Santa Cruz",
      precio: 150,
      disponibilidad: "Disponible",
    },
    {
      id: "2",
      nombre: "Complejo Sur",
      ubicacion: "Zona Sur, Santa Cruz",
      precio: 120,
      disponibilidad: "Reservado",
    },
  ];

  const partidoActual = {
    fecha: "Sábado, 16 de Octubre",
    horario: "19:00 - 20:00 (Fútbol 7)",
    canchaNombre: "Cancha El Río - Campo A",
  };

  const statCards = [
    {
      label: "Partidas Jugadas",
      value: user?.stats?.partidos || 0,
      icon: "⚽",
    },
    {
      label: "MVPs Ganados",
      value: user?.stats?.mvps || 0,
      icon: "🏆",
    },
    {
      label: "Reservas Activas",
      value: user?.stats?.reservas || 0,
      icon: "📅",
    },
  ];

  const recomendadas = canchas.slice(0, 2);

  // Iniciales del avatar
  const iniciales = user?.nombre
    ? `${user.nombre.charAt(0)}${user.apellido ? user.apellido.charAt(0) : ""}`.toUpperCase()
    : "U";

  return (
    <div className="flex min-h-screen bg-slate-100/60 font-sans">
      {/* ── MENÚ LATERAL (SIDEBAR) ── */}
      <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col justify-between hidden md:flex shrink-0">
        <div className="space-y-8">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 text-2xl font-black text-emerald-600">
            📍 DeUna !
          </Link>

          {/* Navegación */}
          <nav className="space-y-2 text-sm font-semibold text-slate-600">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-bold transition"
            >
              📊 Dashboard
            </Link>
            <Link
              href="/dashboard/projects/new"
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 hover:text-emerald-600 rounded-2xl transition"
            >
              📍 Canchas
            </Link>
            <Link
              href="/dashboard/tasks"
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 hover:text-emerald-600 rounded-2xl transition"
            >
              📅 Mis Reservas
            </Link>
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 hover:text-emerald-600 rounded-2xl transition"
            >
              👤 Perfil
            </Link>
            <Link
              href="/dashboard/message"
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 hover:text-emerald-600 rounded-2xl transition"
            >
              💬 Mensajes
            </Link>
            <Link
              href="/dashboard/soporte"
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 hover:text-emerald-600 rounded-2xl transition"
            >
              ❓ Soporte
            </Link>
          </nav>
        </div>
      </aside>

      {/* ── CONTENIDO DERECHO (BARRA SUPERIOR + ÁREA PRINCIPAL) ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* BARRA SUPERIOR PRINCIPAL DE LA APLICACIÓN */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-40">
          <h1 className="text-xl font-extrabold text-slate-800">Dashboard</h1>

          <div className="flex items-center gap-4">
            {/* Buscador */}
            <div className="relative hidden sm:block w-72">
              <input
                type="text"
                placeholder="Buscar canchas, rivales..."
                className="w-full bg-slate-100 text-xs font-medium pl-9 pr-4 py-2 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-700"
              />
              <span className="absolute left-3 top-2.5 text-xs text-slate-400">🔍</span>
            </div>

            {/* Notificaciones */}
            <button
              type="button"
              className="p-2 bg-amber-50 hover:bg-amber-100 rounded-full text-xs transition"
            >
              🔔
            </button>

            {/* Menú de Perfil (Área desplegable) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-100 transition"
              >
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center text-xs shadow-sm">
                  {iniciales}
                </div>
                <div className="text-left hidden sm:block leading-tight">
                  <p className="text-xs font-bold text-slate-800">
                    {user?.nombre} {user?.apellido}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {user?.rol || "Jugador"}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 ml-1">▼</span>
              </button>

              {/* Desplegable con Perfil y Cerrar Sesión */}
              {isMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-800">
                      {user?.nombre} {user?.apellido}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {user?.correo || "usuario@ejemplo.com"}
                    </p>
                  </div>

                  <Link
                    href="/dashboard/profile"
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition"
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

        {/* CONTENIDO DEL DASHBOARD */}
        <main className="p-8 space-y-8 max-w-7xl w-full mx-auto">
          {/* Bienvenida */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-800">
                Hola, {user?.nombre || "Jugador"} 👋
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 font-medium">
                Listo para encontrar tu próximo partido.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/dashboard/projects/new")}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm"
            >
              ⚽ Buscar Canchas
            </button>
          </div>

          {/* Tarjetas de Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {statCards.map((s) => (
              <div
                key={s.label}
                className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"
              >
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-500">{s.label}</p>
                  <p className="text-3xl font-black text-slate-800">{s.value}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-lg">
                  {s.icon}
                </div>
              </div>
            ))}
          </div>

          {/* Partidos Disponibles */}
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">
                  Partidos disponibles
                </h3>
                <p className="text-xs text-slate-400">
                  Únete a un partido organizado por la comunidad.
                </p>
              </div>
              <span className="text-lg">👥</span>
            </div>

            {publishedMatches.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {publishedMatches.map((match) => (
                  <button
                    type="button"
                    key={match.id}
                    onClick={() => router.push(`/dashboard/tasks`)}
                    className="rounded-xl border border-slate-200 p-4 text-left hover:border-emerald-500 transition bg-slate-50 hover:bg-white"
                  >
                    <p className="font-bold text-slate-800 text-sm">{match.nombre}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {match.fecha} · {match.hora_inicio}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs font-medium text-slate-400">
                Todavía no hay partidos publicados.
              </p>
            )}
          </section>

          {/* Sección de Canchas Recomendadas + Próximo Partido */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-800 text-base">
                  Canchas Recomendadas
                </h3>
                <Link
                  href="/dashboard/projects/new"
                  className="text-emerald-600 text-xs font-bold hover:underline"
                >
                  Ver todas
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {recomendadas.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between"
                  >
                    <div className="relative">
                      <CanchaMedia cancha={c} className="h-40" />
                      <span
                        className={`absolute top-3 left-3 rounded-md px-2 py-0.5 text-[10px] font-bold text-white ${
                          c.disponibilidad === "Disponible"
                            ? "bg-emerald-500"
                            : "bg-amber-500"
                        }`}
                      >
                        {c.disponibilidad}
                      </span>
                    </div>

                    <div className="p-4 space-y-3">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">
                          {c.nombre}
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          📍 {c.ubicacion}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="font-black text-slate-800 text-sm">
                          Bs. {c.precio}{" "}
                          <span className="text-[10px] text-slate-400 font-normal">
                            / hr
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => router.push("/dashboard/projects/new")}
                          className="bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-emerald-700 transition"
                        >
                          Reservar DeUna!
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Widget Próximo Partido */}
            <div className="lg:col-span-4 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
              <h3 className="font-extrabold text-slate-800 text-base">
                Próximo Partido
              </h3>

              <div className="space-y-3 text-xs font-semibold text-slate-600">
                <p className="flex items-center gap-2">
                  📅 {partidoActual?.fecha}
                </p>
                <p className="flex items-center gap-2">
                  ⏰ {partidoActual?.horario}
                </p>
                <p className="flex items-center gap-2">
                  📍 {partidoActual?.canchaNombre}
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push("/dashboard/tasks")}
                className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 transition"
              >
                Ver Mis Reservas
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}