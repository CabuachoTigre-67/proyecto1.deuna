"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import bcrypt from "bcryptjs";
import { createClient } from "@/app/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const savedTheme = window.localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme === "dark";
    }
    return true;
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
    rememberMe: false,
  });

  const supabase = createClient();

  useEffect(() => {
    window.localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

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
      const { data: usuario, error } = await supabase
        .from("usuario")
        .select("*")
        .eq("correo", formData.identifier.trim())
        .maybeSingle();

      if (error) {
        setErrorMessage("Error de conexión al verificar credenciales.");
        setLoading(false);
        return;
      }

      if (!usuario) {
        setErrorMessage("El correo electrónico no se encuentra registrado.");
        setLoading(false);
        return;
      }

      const passwordMatch = await bcrypt.compare(formData.password, usuario.contrasena);

      if (!passwordMatch) {
        setErrorMessage("La contraseña ingresada es incorrecta.");
        setLoading(false);
        return;
      }

      localStorage.setItem(
        "userSession",
        JSON.stringify({
          id_usuario: usuario.id_usuario,
          nombre: usuario.nombre,
          correo: usuario.correo,
          rol: usuario.rol,
        })
      );

      router.push("/dashboard");
    } catch (err) {
      setErrorMessage("Ocurrió un error inesperado al procesar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  const stadiumBackground = darkMode
    ? "/images/estadios.jpg/2f775e1f-f221-4860-924c-4a6ebb3538ae.png"
    : "/images/estadios.jpg/207dca3c-b589-4923-9df4-719dfb06d419.png";

  const pageShell = darkMode ? "bg-[#030a0d] text-white" : "bg-[#eaf1ee] text-[#122126]";
  const headerClass = darkMode ? "bg-[#040a0d]" : "bg-[#f5f7f6]";
  const panelClass = darkMode
    ? "bg-[#111d26]/85 border-white/10 text-white shadow-[0_25px_70px_rgba(2,8,14,0.65)]"
    : "bg-[#f4f6f4]/90 border-[#dfe9e6] text-[#16312f] shadow-[0_18px_50px_rgba(15,23,42,0.08)]";
  const mutedText = darkMode ? "text-white/70" : "text-[#1e3b39]";
  const featureCard = darkMode
    ? "border-white/10 bg-white/5 text-white"
    : "border-[#dfe9e6] bg-white/80 text-[#12312d]";
  const inputClass = darkMode
    ? "border-white/10 bg-[#111d26] text-white placeholder:text-slate-400"
    : "border-[#d8e0dd] bg-white text-[#11302f] placeholder:text-slate-500";
  const buttonThemeClass = darkMode
    ? "border-white/10 bg-[#1a262d] text-amber-300 hover:bg-[#243742]"
    : "border-[#dfe9e6] bg-white text-[#122126] hover:bg-slate-100";
  const heroOverlay = darkMode
    ? "linear-gradient(180deg, rgba(2,5,8,0.10) 0%, rgba(2,5,8,0.18) 30%, rgba(2,5,8,0.28) 100%)"
    : "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(7,21,19,0.12) 26%, rgba(7,21,19,0.36) 100%)";
  const lightHeroTitle = darkMode ? "text-white" : "text-[#0fd07f]";
  const lightBrand = darkMode ? "text-[#1bbf6a]" : "text-[#1bbf6a]";
  const pageFooterClass = darkMode ? "bg-[#040b0d] border-white/10 text-white/75" : "bg-[#f4f7f6] border-[#dfe9e6] text-[#12312d]";
  const socialButtonClass = darkMode
    ? "border-white/10 bg-[#101d27] text-white hover:bg-[#172b39]"
    : "border-[#dfe9e6] bg-white text-[#17332f] hover:bg-slate-50";

  return (
    <div className={`min-h-screen flex flex-col ${pageShell}`}>
      <header className={`w-full ${headerClass}`}>
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 font-black text-3xl tracking-tight">
            <div className={`flex h-9 w-9 items-center justify-center rounded-full ${darkMode ? "bg-[#0d1a1f]" : "bg-[#e2f5eb]"}`}>
              <i className="fa-solid fa-futbol text-xl text-[#1bbf6a]" />
            </div>
            <span className={lightBrand}>DeUna!</span>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <button
              type="button"
              aria-label="Cambiar tema"
              onClick={() => setDarkMode(!darkMode)}
              className={`flex h-11 w-11 items-center justify-center rounded-full border ${buttonThemeClass}`}
            >
              <i className={`fa-solid ${darkMode ? "fa-sun" : "fa-moon"}`} />
            </button>

            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-xl border border-emerald-500 bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600"
            >
              Regístrate
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-6 px-4 py-5 sm:px-6 lg:flex-row lg:items-stretch lg:gap-8 lg:px-8 lg:py-7">
        <section
          className="relative overflow-hidden rounded-[28px] lg:w-[58%]"
          style={{
            backgroundImage: `${heroOverlay}, url(${stadiumBackground})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="flex min-h-[470px] flex-col justify-between p-5 sm:p-7 lg:min-h-[760px] lg:p-8">
            <div className="relative z-10 max-w-xl pt-2">
              <h1 className={`text-4xl font-black leading-[1.02] tracking-[-0.04em] sm:text-5xl lg:text-[4.1rem] ${darkMode ? "text-white" : "text-[#1cd87b]"}`}>
                Santa Cruz <br />
                es fútbol, es pasión, <br />
                es <span className={darkMode ? "text-[#38e889]" : "text-[#1cd87b]"}>DeUna!</span>
              </h1>

              <div className="mt-5 h-1.5 w-32 rounded-full bg-emerald-400/90" />

              <p className={`mt-5 max-w-lg text-base sm:text-lg ${darkMode ? "text-white/80" : "text-white/90"}`}>
                Encuentra las mejores canchas, arma tu partido y disfruta del tercer tiempo con tus amigos.
              </p>
            </div>

            <div className={`relative z-10 mt-6 flex items-center gap-3 rounded-2xl border px-4 py-3 backdrop-blur-[2px] ${darkMode ? "border-emerald-500/40 bg-[#0d1c1f]/45" : "border-white/40 bg-[#062f2f]/30"}`}>
              <div className={`flex h-7 w-7 items-center justify-center rounded-full border ${darkMode ? "border-emerald-400/80 bg-[#0f2a2e]/80 text-emerald-300" : "border-emerald-300/80 bg-white/20 text-emerald-200"}`}>
                <i className="fa-solid fa-location-dot text-xs" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Estadio Tahuichi Aguilera</div>
                <div className="text-xs text-white/75">Orullo de Santa Cruz</div>
              </div>
            </div>

            <div className="relative z-10 mt-8 grid gap-3 sm:grid-cols-3">
              {[
                { icon: "fa-location-dot", text: "Canchas cerca de ti", desc: "Busca por ubicación o sector" },
                { icon: "fa-users", text: "Organiza tu partido", desc: "Invita jugadores, reserva y confirma" },
                { icon: "fa-clock", text: "Tercer tiempo", desc: "Comparte el lugar y divide gastos" },
              ].map((item) => (
                <div key={item.text} className={`rounded-2xl border p-3 backdrop-blur-sm sm:p-4 ${featureCard}`}>
                  <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-full ${darkMode ? "bg-emerald-500/10 text-emerald-300" : "bg-emerald-100 text-emerald-700"}`}>
                    <i className={`fa-solid ${item.icon}`} />
                  </div>
                  <h3 className="text-sm font-bold sm:text-base">{item.text}</h3>
                  <p className={`mt-1 text-xs leading-relaxed ${darkMode ? "opacity-80" : "opacity-80"}`}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={`flex w-full items-center justify-center rounded-[28px] border p-4 sm:p-6 lg:w-[42%] lg:p-8 ${panelClass}`}>
          <div className="w-full max-w-[540px]">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`flex h-14 w-14 items-center justify-center rounded-full border-2 ${darkMode ? "border-emerald-500/80 bg-[#0b1a1d]" : "border-emerald-500 bg-[#dff9ee]"}`}>
                  <i className="fa-solid fa-futbol text-2xl text-emerald-500" />
                </div>
                <div>
                  <h2 className={`text-3xl font-black tracking-tight ${darkMode ? "text-white" : "text-[#12312d]"}`}>DeUna!</h2>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className={`text-3xl font-black tracking-tight sm:text-[2.5rem] ${darkMode ? "text-white" : "text-[#12312d]"}`}>
                  Bienvenido a DeUna!
                </h3>
                <p className={`mt-2 text-sm sm:text-base ${mutedText}`}>
                  Inicia sesión para seguir jugando
                </p>
              </div>

              {errorMessage && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  <i className="fa-solid fa-triangle-exclamation mr-2" />
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className={`text-sm font-semibold ${mutedText}`}>
                    Correo electrónico o usuario
                  </label>
                  <div className="relative">
                    <span className={`absolute left-4 top-1/2 -translate-y-1/2 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                      <i className="fa-solid fa-user" />
                    </span>
                    <input
                      type="email"
                      required
                      value={formData.identifier}
                      onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                      placeholder="Correo electrónico o usuario"
                      className={`w-full rounded-xl border py-3 pl-11 pr-3 text-sm outline-none focus:border-emerald-500 ${inputClass}`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={`text-sm font-semibold ${mutedText}`}>
                    Contraseña
                  </label>
                  <div className="relative">
                    <span className={`absolute left-4 top-1/2 -translate-y-1/2 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                      <i className="fa-solid fa-lock" />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Contraseña"
                      className={`w-full rounded-xl border py-3 pl-11 pr-11 text-sm outline-none focus:border-emerald-500 ${inputClass}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-4 top-1/2 -translate-y-1/2 ${darkMode ? "text-slate-400" : "text-slate-500"}`}
                    >
                      <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 text-sm">
                  <label className={`flex cursor-pointer items-center gap-2 ${darkMode ? "text-white/80" : "text-[#12312d]"}`}>
                    <input
                      type="checkbox"
                      checked={formData.rememberMe}
                      onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                      className="h-4 w-4 rounded border-emerald-500 bg-transparent text-emerald-500 focus:ring-emerald-500"
                    />
                    <span>Recordarme</span>
                  </label>

                  <Link href="#" className="font-semibold text-emerald-500 hover:underline">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-3 rounded-xl bg-emerald-500 px-4 py-3.5 text-base font-bold text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Verificando..." : "Iniciar sesión"}
                  <i className="fa-solid fa-arrow-right" />
                </button>
              </form>

              <div className={`relative my-5 flex items-center justify-center ${darkMode ? "text-white/70" : "text-[#1e3b39]"}`}>
                <div className={`h-px w-full ${darkMode ? "bg-white/10" : "bg-[#dfe9e6]"}`} />
                <span className={`absolute bg-transparent px-3 text-[10px] font-semibold uppercase tracking-[0.2em] ${darkMode ? "text-white/70" : "text-[#1e3b39]"}`}>
                  O continúa con
                </span>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className={`flex w-full items-center justify-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ${socialButtonClass}`}
              >
                <i className="fa-brands fa-google text-red-500" />
                <span>Continuar con Google</span>
              </button>

              <div className={`flex items-center justify-center gap-2 pt-2 text-sm ${darkMode ? "text-white/75" : "text-[#12312d]"}`}>
                <span>¿No tienes cuenta?</span>
                <Link href="/register" className="font-bold text-emerald-500 hover:underline">
                  Regístrate aquí
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className={`mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 border-t px-4 py-5 text-sm sm:px-6 lg:px-8 ${pageFooterClass}`}>
        <div className="flex items-center gap-3 font-black text-3xl tracking-tight">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${darkMode ? "bg-[#0b191d]" : "bg-[#e3f2ea]"}`}>
            <i className="fa-solid fa-futbol text-xl text-[#1bbf6a]" />
          </div>
          <span className={lightBrand}>DeUna!</span>
        </div>

        <div className={`hidden items-center gap-2 text-sm md:flex ${darkMode ? "text-white/70" : "text-[#12312d]"}`}>
          <span>© 2025 DeUna! Todos los derechos reservados.</span>
        </div>

        <div className={`flex items-center gap-4 text-sm ${darkMode ? "text-white/70" : "text-[#12312d]"}`}>
          <span>Términos y condiciones</span>
          <span>Política de privacidad</span>
          <span>Soporte</span>
        </div>
      </footer>
    </div>
  );
}