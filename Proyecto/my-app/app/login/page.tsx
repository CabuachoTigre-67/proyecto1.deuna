"use client";

import React, { useState } from "react";
import Link from "next/link";
import Button from "../components/Button"; // Usa tu componente existente

export default function LoginPage() {
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
    rememberMe: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Lógica para procesar la autenticación
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white text-gray-800">
      {/* 1. Header */}
      <header className="w-full flex items-center justify-between py-4 px-8 bg-white border-b border-gray-100">
        <div className="text-3xl font-extrabold text-gray-900 tracking-tight">
          DeUna<span className="text-green-500">!</span>
        </div>
        <Link
          href="/register"
          className="flex items-center gap-2 bg-green-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200"
        >
          <span>📝</span> Registrarse
        </Link>
      </header>

      {/* 2. Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 px-6 py-8 items-center">
        {/* Columna Izquierda: Hero & Beneficios */}
        <div className="lg:col-span-7 h-full flex flex-col justify-between space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
              <span className="text-green-500">Santa Cruz</span>
              <br />
              es fútbol, es pasión,
              <br />
              es <span className="text-green-500">DeUna!</span>
            </h1>
            <div className="w-24 h-1 bg-green-500 rounded my-2"></div>
            <p className="text-gray-600 font-medium text-sm max-w-md">
              Encuentra las mejores canchas, arma tu partido, juega y disfruta del
              tercer tiempo con tus amigos.
            </p>
          </div>

          {/* Banner Estadio */}
          <div className="relative rounded-2xl overflow-hidden shadow-sm h-64 lg:h-80 w-full bg-gray-200">
            <img
              src="/stadium-banner.jpg"
              alt="Estadio DeUna"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-4 bg-green-500/80 text-white font-bold px-3 py-1 rounded text-xs backdrop-blur-sm">
              DEUNA.BO
            </div>
          </div>

          {/* 3 Beneficios */}
          <div className="grid grid-cols-3 gap-4 text-xs pt-2">
            <div className="space-y-1">
              <div className="text-lg">👥</div>
              <h4 className="font-bold text-gray-900">Organiza tu partido</h4>
              <p className="text-gray-500 leading-tight">
                Invita jugadores, reserva y confirma tu partido.
              </p>
            </div>

            <div className="space-y-1">
              <div className="text-lg">📍</div>
              <h4 className="font-bold text-gray-900">Canchas cerca de ti</h4>
              <p className="text-gray-500 leading-tight">
                Busca por ubicacion o sector y encuentra tu cancha ideal.
              </p>
            </div>

            <div className="space-y-1">
              <div className="text-lg">🍴</div>
              <h4 className="font-bold text-gray-900">Tercer tiempo</h4>
              <p className="text-gray-500 leading-tight">
                Organiza lo que se compartira despues del partido y divide gastos fácilmente.
              </p>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Tarjeta de Login */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div className="w-full max-w-md bg-white border border-gray-200 rounded-3xl p-8 shadow-sm flex flex-col items-center">
            <div className="text-4xl mb-2">⚽</div>

            <h2 className="text-2xl font-bold text-gray-900 text-center">
              Inicia sesion en <span className="text-green-500">DeUna!</span>
            </h2>
            <p className="text-xs text-gray-500 mb-6 text-center">
              Inicia sesion para seguir jugando
            </p>

            <form onSubmit={handleSubmit} className="w-full space-y-4">
              {/* Input Usuario */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 text-sm">
                  👤
                </span>
                <input
                  type="text"
                  placeholder="Correo electronico o usuario"
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800"
                  value={formData.identifier}
                  onChange={(e) =>
                    setFormData({ ...formData, identifier: e.target.value })
                  }
                />
              </div>

              {/* Input Contraseña */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 text-sm">
                  🔒
                </span>
                <input
                  type="password"
                  placeholder="Contraseña"
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>

              {/* Recordarme y Contraseña */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center space-x-2 cursor-pointer font-bold text-gray-800">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-green-500 focus:ring-green-500 w-4 h-4"
                    checked={formData.rememberMe}
                    onChange={(e) =>
                      setFormData({ ...formData, rememberMe: e.target.checked })
                    }
                  />
                  <span>RECORDARME</span>
                </label>
                <a href="#" className="text-green-600 font-semibold hover:underline">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              {/* Botón Principal (Usa app/components/Button.tsx) */}
              <Button type="submit" fullWidth variant="primary">
                INICIAR SESION
              </Button>
            </form>

            {/* Separador */}
            <div className="relative w-full my-6 flex items-center justify-center">
              <div className="border-t border-gray-300 w-full"></div>
              <span className="bg-white px-3 text-xs text-gray-400 absolute">
                O Inicia sesion con
              </span>
            </div>

            {/* Redes Sociales */}
            <div className="grid grid-cols-2 gap-4 w-full">
              <button
                type="button"
                className="flex items-center justify-center py-2.5 px-4 bg-gray-100 hover:bg-gray-200 rounded-xl transition font-bold text-blue-600 text-sm"
              >
                Google
              </button>
              <button
                type="button"
                className="flex items-center justify-center py-2.5 px-4 bg-gray-100 hover:bg-gray-200 rounded-xl transition font-bold text-blue-800 text-base"
              >
                f
              </button>
            </div>

            <div className="mt-6 text-2xl">🏃‍♂️</div>
          </div>
        </div>
      </main>

      {/* 3. Footer */}
      <footer className="w-full bg-emerald-50 py-4 px-8 border-t border-emerald-100 flex flex-col md:flex-row items-center justify-between text-xs text-gray-800">
        <div className="flex items-center gap-1 font-bold text-lg">
          <span>⚽</span> DeUna<span className="text-green-500">!</span>
        </div>
        <div className="text-gray-600 my-2 md:my-0">
          © 2026 DeUna! Todos los derechos reservados.
        </div>
        <div className="flex gap-4 font-bold text-gray-800">
          <Link href="#" className="hover:underline">
            Términos y condiciones
          </Link>
          <Link href="#" className="hover:underline">
            Política de privacidad
          </Link>
          <Link href="#" className="hover:underline">
            Soporte
          </Link>
        </div>
      </footer>
    </div>
  );
}