"use client";

import React from "react";

export default function DashboardPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. Métrica Cards Superior */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
              <span className="p-1 bg-emerald-100 text-emerald-600 rounded-full text-xs">❎</span>
              Partidas Jugadas
            </div>
            <p className="text-3xl font-extrabold text-gray-900">34</p>
          </div>
          <div className="text-emerald-500 font-bold text-xl">📈</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
              <span className="p-1 bg-emerald-100 text-emerald-600 rounded-full text-xs">🏆</span>
              MVPs Ganados
            </div>
            <p className="text-3xl font-extrabold text-gray-900">7</p>
          </div>
          <div className="text-emerald-500 font-bold text-xl">📈</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
              <span className="p-1 bg-emerald-100 text-emerald-600 rounded-full text-xs">📅</span>
              Reservas Activas
            </div>
            <p className="text-3xl font-extrabold text-gray-900">2</p>
          </div>
          <div className="text-emerald-500 font-bold text-xl">📈</div>
        </div>
      </div>

      {/* 2. Sección Central (Canchas Recomendadas y Próximo Partido) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Canchas Recomendadas */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-lg">Canchas Recomendadas</h3>
            <button className="text-emerald-600 text-xs font-bold hover:underline">
              Ver Detalles
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Cancha 1 */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
              <div className="relative h-40 bg-slate-700">
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="bg-emerald-100 text-emerald-700 font-bold text-[10px] px-2 py-1 rounded-md">
                    Disponible
                  </span>
                  <span className="bg-gray-800 text-white font-bold text-[10px] px-2 py-1 rounded-md">
                    Césped
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Cancha Tauthi...</h4>
                  <p className="text-xs text-gray-400">📍 Av. San Martin 420, Equipetrol</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="font-extrabold text-gray-900 text-sm">Bs 180 <span className="text-xs text-gray-400 font-normal">/ hr</span></span>
                  <button className="bg-green-500 text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-green-600 transition">
                    Reservar DeUna →
                  </button>
                </div>
              </div>
            </div>

            {/* Cancha 2 */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
              <div className="relative h-40 bg-slate-700">
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="bg-amber-100 text-amber-700 font-bold text-[10px] px-2 py-1 rounded-md">
                    Casi Lleno
                  </span>
                  <span className="bg-gray-800 text-white font-bold text-[10px] px-2 py-1 rounded-md">
                    Césped
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Complejo Deportivo Rlver</h4>
                  <p className="text-xs text-gray-400">📍 Costanera 5to Anillo, Urbarí</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="font-extrabold text-gray-900 text-sm">Bs 150 <span className="text-xs text-gray-400 font-normal">/ hr</span></span>
                  <button className="bg-green-500 text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-green-600 transition">
                    Reservar DeUna →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Widget Próximo Partido */}
        <div className="lg:col-span-4 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <h3 className="font-bold text-gray-900 text-base">Próximo Partido</h3>

          {/* Contador de Tiempo */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-emerald-50 rounded-xl p-2">
              <span className="text-emerald-600 font-extrabold text-lg block">01</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Días</span>
            </div>
            <div className="bg-emerald-50 rounded-xl p-2">
              <span className="text-emerald-600 font-extrabold text-lg block">03</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Horas</span>
            </div>
            <div className="bg-emerald-50 rounded-xl p-2">
              <span className="text-emerald-600 font-extrabold text-lg block">36</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Min</span>
            </div>
            <div className="bg-emerald-50 rounded-xl p-2">
              <span className="text-emerald-600 font-extrabold text-lg block">56</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Seg</span>
            </div>
          </div>

          {/* Datos del evento */}
          <div className="space-y-2 text-xs font-semibold text-gray-600 pt-2">
            <p className="flex items-center gap-2"><span>📅</span> Sábado, 16 de Octubre</p>
            <p className="flex items-center gap-2"><span>⏰</span> 19:00 - 20:00 (Fútbol 7)</p>
            <p className="flex items-center gap-2"><span>📍</span> Cancha El Río - Campo A</p>
          </div>

          {/* Simulación Mapa */}
          <div className="h-24 bg-emerald-100 rounded-xl flex items-center justify-center text-xs text-emerald-800 font-bold border border-emerald-200">
            🗺️ Ubicación en mapa
          </div>

          <button className="w-full py-3 bg-green-500 text-white font-bold rounded-xl text-xs hover:bg-green-600 transition">
            Ver Detalles del Partido
          </button>
        </div>
      </div>

      {/* 3. Banner Votar MVP */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl text-xl">🏆</div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Votar MVP — Cancha El Río (12 Ago)</h4>
            <p className="text-xs text-gray-400">El partido ya finalizó. Tienes 24 horas para votar por la figura del encuentro.</p>
          </div>
        </div>
        <button className="bg-green-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-green-600 transition">
          Votar DeUna!
        </button>
      </div>

      {/* 4. Novedades del Club */}
      <div className="space-y-4">
        <h3 className="font-bold text-gray-900 text-lg">Novedades del Club</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-3 flex items-center gap-3 shadow-sm">
            <div className="w-12 h-12 bg-slate-800 rounded-xl flex-shrink-0"></div>
            <div>
              <h5 className="font-bold text-gray-900 text-xs leading-snug">Torneo Apertura: Inscripciones Abiertas</h5>
              <p className="text-[10px] text-gray-400 mt-1">Hace 2 horas</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-3 flex items-center gap-3 shadow-sm">
            <div className="w-12 h-12 bg-slate-800 rounded-xl flex-shrink-0"></div>
            <div>
              <h5 className="font-bold text-gray-900 text-xs leading-snug">Nuevos balones oficiales en Cancha El Río</h5>
              <p className="text-[10px] text-gray-400 mt-1">Ayer</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-3 flex items-center gap-3 shadow-sm">
            <div className="w-12 h-12 bg-slate-800 rounded-xl flex-shrink-0"></div>
            <div>
              <h5 className="font-bold text-gray-900 text-xs leading-snug">Consejos: Cómo cuidar tu calentamiento antes de jugar</h5>
              <p className="text-[10px] text-gray-400 mt-1">12 Oct</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-3 flex items-center gap-3 shadow-sm">
            <div className="w-12 h-12 bg-slate-800 rounded-xl flex-shrink-0"></div>
            <div>
              <h5 className="font-bold text-gray-900 text-xs leading-snug">Se habilitaron canchas de paddle en Complejo Sur</h5>
              <p className="text-[10px] text-gray-400 mt-1">08 Oct</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}