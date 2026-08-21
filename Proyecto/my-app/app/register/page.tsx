"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [position, setPosition] = useState("DFC");
  const [level, setLevel] = useState("Intermedio");
  const [accountType, setAccountType] = useState("Jugador");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-between font-sans text-gray-800">
      {/* Header */}
      <header className="w-full bg-white py-4 px-8 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2 text-2xl font-extrabold text-gray-900">
          <span className="text-green-500">📍</span> DeUna<span className="text-green-500">!</span>
        </div>
        <div className="text-xs font-semibold text-gray-600">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-green-600 hover:underline">
            Inicia sesión →
          </Link>
        </div>
      </header>

      {/* Formulario Contenedor Centrado */}
      <main className="flex-1 my-8 flex items-center justify-center px-4">
        <div className="w-full max-w-xl bg-white border border-gray-200 rounded-3xl p-8 shadow-sm flex flex-col items-center">
          {/* Título */}
          <h1 className="text-2xl font-bold text-gray-900 text-center">
            Regístrate en <span className="text-green-600">DeUna!</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1 mb-6 text-center">
            Crea tu perfil, arma tu equipo y reserva tu próxima cancha en segundos.
          </p>

          {/* Avatar Upload */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200 text-gray-400 text-3xl">
              👤
              <button
                type="button"
                className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-white cursor-pointer"
              >
                +
              </button>
            </div>
            <span className="text-xs text-green-600 font-semibold mt-2 cursor-pointer">
              Sube tu foto de perfil
            </span>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-6">
            {/* Sección: Información Personal */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-green-600 tracking-wider uppercase border-b border-gray-100 pb-1">
                Información Personal
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Mateo Fernández"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    placeholder="mateo@ejemplo.com"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">
                    Edad
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 24"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">
                    Fecha de Nacimiento
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    <select className="px-1 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500 focus:outline-none">
                      <option>Día</option>
                    </select>
                    <select className="px-1 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500 focus:outline-none">
                      <option>Mes</option>
                    </select>
                    <select className="px-1 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500 focus:outline-none">
                      <option>Año</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">
                    Apodo / Alias
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. El 10 de la calle"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">
                    Teléfono
                  </label>
                  <div className="flex gap-2">
                    <span className="px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 flex items-center">
                      +591
                    </span>
                    <input
                      type="text"
                      placeholder="71234567"
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sección: Detalles del Jugador */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold text-green-600 tracking-wider uppercase border-b border-gray-100 pb-1">
                Detalles del Jugador
              </h3>

              {/* Posición Preferida */}
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-2">
                  Posición Preferida
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "POR", title: "Portero" },
                    { id: "DFC", title: "Defensa" },
                    { id: "MC", title: "Mediocampo" },
                    { id: "DC", title: "Delantero" },
                  ].map((pos) => (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => setPosition(pos.id)}
                      className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                        position === pos.id
                          ? "border-green-500 bg-emerald-50 text-green-700 font-bold"
                          : "border-gray-200 bg-white text-gray-600"
                      }`}
                    >
                      <div className="text-xs font-bold">{pos.id}</div>
                      <div className="text-[9px] text-gray-400">{pos.title}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Nivel de Juego */}
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-2">
                  Nivel de Juego
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "Amateur", stars: "⭐" },
                    { id: "Intermedio", stars: "⭐⭐" },
                    { id: "Profesional", stars: "⭐⭐⭐" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setLevel(item.id)}
                      className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                        level === item.id
                          ? "border-green-500 bg-emerald-50 text-green-700 font-bold"
                          : "border-gray-200 bg-white text-gray-600"
                      }`}
                    >
                      <div className="text-[10px]">{item.stars}</div>
                      <div className="text-xs">{item.id}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tipo de Cuenta */}
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-2">
                  Tipo de Cuenta
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAccountType("Jugador")}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition cursor-pointer ${
                      accountType === "Jugador"
                        ? "border-green-500 bg-emerald-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <span className="p-1.5 bg-green-100 text-green-600 rounded-lg text-sm">👤</span>
                    <div>
                      <div className="text-xs font-bold text-gray-900">Jugador</div>
                      <div className="text-[10px] text-gray-500 leading-tight mt-0.5">
                        Busca canchas y arma tus partidos.
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAccountType("Dueño")}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition cursor-pointer ${
                      accountType === "Dueño"
                        ? "border-green-500 bg-emerald-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <span className="p-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm">🏠</span>
                    <div>
                      <div className="text-xs font-bold text-gray-900">Dueño de cancha</div>
                      <div className="text-[10px] text-gray-500 leading-tight mt-0.5">
                        Administra tus reservas y gana más.
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Botón Crear Cuenta */}
            <button
              type="submit"
              className="w-full py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition duration-200 text-xs flex items-center justify-center gap-1 cursor-pointer"
            >
              CREAR CUENTA →
            </button>
          </form>

          {/* Separador */}
          <div className="relative w-full my-6 flex items-center justify-center">
            <div className="border-t border-gray-200 w-full"></div>
            <span className="bg-white px-3 text-[10px] text-gray-400 uppercase tracking-wider absolute">
              O regístrate con
            </span>
          </div>

          {/* Redes Sociales */}
          <div className="grid grid-cols-2 gap-4 w-full">
            <button
              type="button"
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition text-xs font-bold text-gray-700 cursor-pointer"
            >
              <span>❌</span> Google
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition text-xs font-bold text-blue-800 cursor-pointer"
            >
              <span>f</span> Facebook
            </button>
          </div>

          <p className="text-[10px] text-gray-400 mt-6 text-center">
            Al registrarte, aceptas nuestros{" "}
            <a href="#" className="underline">Términos y condiciones</a> y{" "}
            <a href="#" className="underline">Política de privacidad</a>.
          </p>
        </div>
      </main>

      {/* Footer minimalista */}
      <footer className="w-full bg-white py-4 text-center border-t border-gray-200 text-xs text-gray-400">
        © 2026 DeUna! Todos los derechos reservados.
      </footer>
    </div>
  );
}