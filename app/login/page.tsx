"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import bcrypt from "bcryptjs";
import { createClient } from "@/app/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(true);
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
      // 1. Busca en la tabla 'usuario' usando el atributo 'correo'
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

      // 2. Si el correo no existe en la base de datos
      if (!usuario) {
        setErrorMessage("El correo electrónico no se encuentra registrado.");
        setLoading(false);
        return;
      }

      // 3. Compara la contraseña ingresada con el hash del atributo 'contrasena'
      const passwordMatch = await bcrypt.compare(formData.password, usuario.contrasena);

      if (!passwordMatch) {
        setErrorMessage("La contraseña ingresada es incorrecta.");
        setLoading(false);
        return;
      }

      // 4. Si coincide la clave, guarda la sesión y redirige
      localStorage.setItem("userSession", JSON.stringify({
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol
      }));

      router.push("/dashboard"); // Ajusta la ruta de destino deseada
    } catch (err) {
      setErrorMessage("Ocurrió un error inesperado al procesar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans ${darkMode ? "dark bg-[#0b1320] text-white" : "bg-gray-50 text-gray-900"}`}>
      
      {/* Navbar Superior */}
      <header className="w-full h-16 px-6 flex items-center justify-between border-b border-gray-200/10 bg-white/5 backdrop-blur-md fixed top-0 left-0 z-50">
        <div className="flex items-center gap-2 font-bold text-xl tracking-wide">
          <span className="text-emerald-500 text-2xl">⚽</span>
          <span>DeUna!</span>
        </div>

        <div className="flex items-center gap-4 text-sm">
          {/* Ubicación */}
          <div className="hidden sm:flex items-center gap-1.5 text-gray-400 dark:text-gray-300">
            <span className="text-emerald-500">📍</span>
            <span>Santa Cruz de la Sierra</span>
          </div>

          {/* Toggle Modo Oscuro / Claro */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full hover:bg-white/10 text-amber-400 transition"
            aria-label="Cambiar tema"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>

          {/* Botón Crear Cuenta */}
          <Link
            href="/register"
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2 rounded-xl transition shadow-lg shadow-emerald-500/20"
          >
            Crear cuenta
          </Link>
        </div>
      </header>

      {/* Cuerpo Principal */}
      <main className="flex-1 flex flex-col lg:flex-row pt-16 min-h-screen">
        
        {/* Columna Izquierda: Hero con imagen de fondo */}
        <div className="relative lg:w-1/2 min-h-[500px] lg:min-h-full flex flex-col justify-between p-8 lg:p-12 bg-cover bg-center" style={{ backgroundImage: "url('/stadium-banner.jpg')" }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30 z-0" />

          {/* Texto Principal */}
          <div className="relative z-10 max-w-lg mt-auto lg:mt-12">
            <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight">
              Santa Cruz <br />
              es fútbol, es pasión, <br />
              es <span className="text-emerald-500">DeUna!</span>
            </h1>
            <p className="mt-4 text-gray-200 text-sm lg:text-base font-normal">
              Encuentra canchas, arma tu partido y disfruta el juego con tus amigos.
            </p>
          </div>

          {/* Tarjetas Inferiores */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8">
            <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <span className="text-lg">⚽</span>
              <h3 className="font-bold text-white text-sm mt-1">Canchas cerca de ti</h3>
              <p className="text-xs text-gray-300 mt-0.5">Encuentra espacios deportivos disponibles.</p>
            </div>

            <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <span className="text-lg">👥</span>
              <h3 className="font-bold text-white text-sm mt-1">Organiza tu partido</h3>
              <p className="text-xs text-gray-300 mt-0.5">Crea o únete a partidos abiertos.</p>
            </div>

            <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <span className="text-lg">🍕</span>
              <h3 className="font-bold text-white text-sm mt-1">Tercer Tiempo</h3>
              <p className="text-xs text-gray-300 mt-0.5">Decide antes del partido si quieres participar y divide la cuota automáticamente.</p>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Formulario */}
        <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12 dark:bg-[#0b1320] bg-white">
          <div className="w-full max-w-md space-y-6">
            <div>
              <h2 className="text-3xl font-bold dark:text-white text-gray-900">
                Bienvenido a DeUna!
              </h2>
              <p className="text-sm dark:text-gray-400 text-gray-500 mt-1">
                Inicia sesión para seguir jugando.
              </p>
            </div>

            {/* Mensaje de Error en Pantalla */}
            {errorMessage && (
              <div className="p-3 bg-red-500/10 border border-red-500/40 rounded-xl text-red-400 text-xs font-medium flex items-center gap-2">
                <span>⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campo Correo */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold dark:text-gray-300 text-gray-700">
                  Correo electrónico
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">✉️</span>
                  <input
                    type="email"
                    required
                    placeholder="Ingresa tu correo"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border dark:border-white/10 border-gray-200 dark:bg-[#131c2e] bg-gray-50 text-sm focus:outline-none focus:border-emerald-500 transition"
                    value={formData.identifier}
                    onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                  />
                </div>
              </div>

              {/* Campo Contraseña */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold dark:text-gray-300 text-gray-700">
                  Contraseña
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔒</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Ingresa tu contraseña"
                    className="w-full pl-10 pr-10 py-3 rounded-xl border dark:border-white/10 border-gray-200 dark:bg-[#131c2e] bg-gray-50 text-sm focus:outline-none focus:border-emerald-500 transition"
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

              {/* Checkbox & Olvidaste contraseña */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer dark:text-gray-300 text-gray-600">
                  <input
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                    className="rounded dark:bg-[#131c2e] border-gray-300 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Recordarme</span>
                </label>
                <a href="#" className="text-emerald-500 font-medium hover:underline">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              {/* Botón Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 font-bold text-white rounded-xl shadow-lg shadow-emerald-500/20 transition text-sm tracking-wide uppercase flex justify-center items-center"
              >
                {loading ? "VERIFICANDO..." : "INICIAR SESIÓN"}
              </button>
            </form>

            {/* Separador */}
            <div className="relative flex items-center justify-center my-6">
              <div className="w-full border-t dark:border-white/10 border-gray-200"></div>
              <span className="absolute px-3 text-[10px] uppercase tracking-wider dark:bg-[#0b1320] bg-white text-gray-400 font-medium">
                O CONTINÚA CON
              </span>
            </div>

            {/* SSO Google */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-2 py-3 border dark:border-white/10 border-gray-200 rounded-xl dark:bg-[#131c2e] bg-white hover:bg-gray-50 dark:hover:bg-white/5 transition text-sm font-medium"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continuar con Google</span>
            </button>

            {/* Pie del Formulario */}
            <p className="text-center text-xs dark:text-gray-400 text-gray-500 pt-4">
              ¿No tienes una cuenta?{" "}
              <Link href="/register" className="text-emerald-500 font-semibold hover:underline">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}