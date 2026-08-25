"use client";

import React from "react";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-800 font-sans">
      {/* Sidebar Izquierda */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between p-6">
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-2 text-2xl font-extrabold text-gray-900">
            <span className="text-green-500">📍</span> DeUna<span className="text-green-500">!</span>
          </div>

          {/* Menú de Navegación */}
          <nav className="space-y-1 text-sm font-medium">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-3 bg-emerald-50 text-emerald-700 font-bold rounded-xl transition"
            >
              <span>🎛️</span> Dashboard
            </Link>
            <Link
              href="#"
              className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition"
            >
              <span>📍</span> Canchas
            </Link>
            <Link
              href="#"
              className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition"
            >
              <span>📅</span> Mis Reservas
            </Link>
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition"
            >
              <span>👤</span> Perfil
            </Link>
            <Link
              href="#"
              className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition"
            >
              <span>💬</span> Mensajes
            </Link>
            <Link
              href="#"
              className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition"
            >
              <span>❓</span> Soporte
            </Link>
          </nav>
        </div>

        {/* Banner Invitación */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-xs">
          <h4 className="font-bold text-emerald-800 mb-1">¡Invita a tus amigos!</h4>
          <p className="text-emerald-600 leading-snug">
            Comparte partidos de forma directa y divide los gastos de cancha sin vueltas.
          </p>
        </div>
      </aside>

      {/* Área de Contenido con Header Superior */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Navbar Superior */}
        <header className="h-20 bg-white border-b border-gray-200 px-8 flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-gray-900">Dashboard</h1>

          <div className="flex items-center gap-4">
            {/* Buscador */}
            <div className="relative w-80">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 text-sm">
                🔍
              </span>
              <input
                type="text"
                placeholder="Buscar canchas, rivales..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Notificaciones */}
            <button className="p-2.5 bg-gray-50 border border-gray-200 rounded-full hover:bg-gray-100 transition text-sm">
              🔔
            </button>

            {/* Usuario */}
            <div className="flex items-center gap-3 pl-2">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm border-2 border-green-500">
                ET
              </div>
              <div className="text-xs">
                <p className="font-bold text-gray-900 leading-tight">El Toro</p>
                <p className="text-gray-400">Jugador</p>
              </div>
            </div>
          </div>
        </header>

        {/* Vista dinámica */}
        <main className="p-8 overflow-y-auto flex-1">{children}</main>
      </div>
    </div>
  );
}