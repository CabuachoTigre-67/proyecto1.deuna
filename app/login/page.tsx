"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/app/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
    rememberMe: false,
  });

  const supabase = createClient();

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: formData.identifier.trim(),
        password: formData.password,
      });

      if (authError) {
        setErrorMessage("Correo o contraseña incorrectos.");
        setLoading(false);
        return;
      }

      const { data: usuario } = await supabase
        .from("usuario")
        .select("*")
        .eq("correo", formData.identifier.trim())
        .maybeSingle();

      if (usuario) {
        const rol = String(usuario.rol || "").trim().toLowerCase();

        localStorage.setItem(
          "userSession",
          JSON.stringify({
            id_usuario: usuario.id_usuario,
            nombre: usuario.nombre,
            correo: usuario.correo,
            rol: usuario.rol,
          })
        );

        let destino = "/dashboard/jugador";

        if (rol === "admin" || rol === "administrador") {
          destino = "/dashboard/administrador";
        } else if (rol === "mantenimiento") {
          destino = "/dashboard/mantenimiento";
        }

        router.refresh();
        router.push(destino);
        return;
      }

      router.refresh();
      router.push("/dashboard/jugador");
    } catch (err) {
      setErrorMessage("Ocurrió un error inesperado al procesar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  const stadiumImage = darkMode ? "/estadio.jpg" : "/estadioB.jpg";

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
        darkMode ? "bg-[#0b0c0f] text-white" : "bg-[#edf9f0] text-[#111111]"
      }`}
      style={{
        backgroundImage: `linear-gradient(rgba(2,8,16,0.46), rgba(2,8,16,0.46)), url('${stadiumImage}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <header
        className={`w-full h-16 px-4 sm:px-6 flex items-center justify-between border-b fixed top-0 left-0 z-50 backdrop-blur-md ${
          darkMode ? "border-white/10 bg-[#0b1320]/80" : "border-[#dfeae2] bg-[#f9fcfa]/90"
        }`}
      >
        <div className={`flex items-center gap-2 font-black text-2xl tracking-tight ${darkMode ? "text-white" : "text-[#111111]"}`}>
          <span className="text-[#34d77a] text-2xl">⚽</span>
          <span>DeUna!</span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 text-sm">
          <div className={`hidden sm:flex items-center gap-1.5 ${darkMode ? "text-gray-300" : "text-[#4b5f52]"}`}>
            <span className="text-[#34d77a]">📍</span>
            <span>Santa Cruz de la Sierra</span>
          </div>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-full transition ${darkMode ? "hover:bg-white/10 text-amber-400" : "hover:bg-[#eaf9f0] text-[#1fa85f]"}`}
            aria-label="Cambiar tema"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>

          <Link
            href="/register"
            className="bg-[#34d77a] hover:bg-[#29c66f] text-white font-semibold px-4 py-2 rounded-xl transition shadow-lg shadow-[#34d77a]/25 border border-[#1fa85f]"
          >
            Registrarse
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full pt-20 pb-8 px-4 sm:px-6 lg:px-10">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <section className="relative w-full max-w-[650px] overflow-hidden rounded-[28px] border border-white/10 bg-black/20 p-4 shadow-2xl lg:min-h-[640px] lg:p-6">
            <div className="flex h-full min-h-[420px] flex-col justify-between rounded-[22px] border border-white/5 bg-black/10 p-4 backdrop-blur-[2px] sm:p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#34d77a]/20 border border-[#34d77a]/40 flex items-center justify-center text-lg shadow-md">
                    ⚽
                  </div>
                  <div className="hidden h-10 w-10 rounded-full border border-white/10 bg-white/5 md:flex items-center justify-center text-xl">
                    ☰
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <h1 className="max-w-xl text-3xl font-black leading-[1.05] tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
                    Santa Cruz <br />
                    es fútbol, es pasión, <br />
                    es <span className="text-[#34d77a]">DeUna!</span>
                  </h1>

                  <p className="max-w-md text-sm text-slate-200 sm:text-base">
                    Encuentra canchas, arma tu partido y disfruta el juego con tus amigos.
                  </p>
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  { icon: "⚽", title: "Organiza tu partido", text: "Invita jugadores, reserva y arma tu grupo." },
                  { icon: "📍", title: "Canchas cerca de ti", text: "Busca y selecciona la mejor opción." },
                  { icon: "🍕", title: "Tercer tiempo", text: "Disfruta el momento después del partido." },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-black/20 p-3 shadow-lg backdrop-blur-sm"
                  >
                    <div className="mb-2 text-xl">{item.icon}</div>
                    <h3 className="text-sm font-bold text-white">{item.title}</h3>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-200">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="w-full max-w-[450px] lg:mr-2">
            <div
              className={`rounded-[30px] border p-5 shadow-[0_18px_45px_rgba(0,0,0,0.18)] backdrop-blur-md sm:p-6 ${
                darkMode ? "border-white/10 bg-[#0d1320]/80" : "border-[#dfe9e2] bg-[#f9fcfa]/90"
              }`}
            >
              <div className="mb-6 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#111111] bg-[#f4f5f3] text-2xl shadow-sm">
                  ⚽
                </div>
              </div>

              <div className="mb-6 text-center space-y-2">
                <h2 className={`text-3xl font-black tracking-[-0.04em] ${darkMode ? "text-white" : "text-[#111111]"}`}>
                  Inicia sesión en DeUna!
                </h2>
                <p className={`${darkMode ? "text-gray-300" : "text-[#4b5f52]"}`}>
                  Inicia sesión para seguir jugando
                </p>
              </div>

              {errorMessage && (
                <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-400">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className={`text-xs font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">✉️</span>
                    <input
                      type="email"
                      required
                      placeholder="Ingresa tu correo"
                      className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition ${
                        darkMode
                          ? "border-white/10 bg-[#131d2b] text-white placeholder:text-gray-400 focus:border-[#34d77a]"
                          : "border-[#dfeae2] bg-white text-[#111111] placeholder:text-gray-400 focus:border-[#34d77a]"
                      }`}
                      value={formData.identifier}
                      onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={`text-xs font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                    Contraseña
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔒</span>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Ingresa tu contraseña"
                      className={`w-full rounded-xl border py-3 pl-10 pr-10 text-sm outline-none transition ${
                        darkMode
                          ? "border-white/10 bg-[#131d2b] text-white placeholder:text-gray-400 focus:border-[#34d77a]"
                          : "border-[#dfeae2] bg-white text-[#111111] placeholder:text-gray-400 focus:border-[#34d77a]"
                      }`}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs"
                    >
                      {showPassword ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 text-xs pt-1">
                  <label className={`flex items-center gap-2 cursor-pointer ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    <input
                      type="checkbox"
                      checked={formData.rememberMe}
                      onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                      className="rounded border-gray-300 text-[#34d77a] focus:ring-[#34d77a]"
                    />
                    <span>Recordarme</span>
                  </label>

                  <a href="#" className="font-medium text-[#34d77a] hover:underline">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl border border-[#1fa85f] bg-[#34d77a] py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-[#34d77a]/25 transition hover:bg-[#2ec96e] disabled:opacity-60"
                >
                  {loading ? "VERIFICANDO..." : "INICIAR SESIÓN"}
                </button>
              </form>

              <div className="relative my-6 flex items-center justify-center">
                <div className={`w-full border-t ${darkMode ? "border-white/10" : "border-gray-200"}`} />
                <span
                  className={`absolute px-3 text-[10px] font-medium uppercase tracking-[0.2em] ${
                    darkMode ? "bg-[#0d1320] text-gray-300" : "bg-[#f9fcfa] text-gray-500"
                  }`}
                >
                  O continúa con
                </span>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className={`w-full rounded-xl border py-3 text-sm font-medium transition ${
                  darkMode
                    ? "border-white/10 bg-[#131d2b] text-white hover:bg-[#182437]"
                    : "border-[#dfeae2] bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  Continuar con Google
                </span>
              </button>

              <p className={`pt-4 text-center text-xs ${darkMode ? "text-gray-300" : "text-gray-500"}`}>
                ¿No tienes una cuenta?{" "}
                <Link href="/register" className="font-semibold text-[#34d77a] hover:underline">
                  Regístrate aquí
                </Link>
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
