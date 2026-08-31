"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import bcrypt from "bcryptjs";
import { createClient } from "@/app/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  // Estados del formulario básico
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [apodo, setApodo] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Estados de preferencias de juego
  const [position, setPosition] = useState("DFC");
  const [preferredDays, setPreferredDays] = useState<string[]>([]);
  const [preferredShift, setPreferredShift] = useState("Noche");

  // Control de interfaz
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleDay = (dayKey: string) => {
    setPreferredDays((prev) =>
      prev.includes(dayKey) ? prev.filter((d) => d !== dayKey) : [...prev, dayKey]
    );
  };

  const handleGoogleRegister = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validación de teléfono (exactamente 8 dígitos numéricos)
    const phoneRegex = /^\d{8}$/;
    if (!phoneRegex.test(telefono)) {
      setErrorMessage("El teléfono debe contener exactamente 8 dígitos numéricos.");
      return;
    }

    if (!fechaNacimiento) {
      setErrorMessage("Por favor selecciona tu fecha de nacimiento.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const emailFormateado = correo.trim().toLowerCase();

      // 1. Verificar si el correo ya existe en la tabla usuario
      const { data: usuarioExistente } = await supabase
        .from("usuario")
        .select("id_usuario")
        .eq("correo", emailFormateado)
        .maybeSingle();

      if (usuarioExistente) {
        setErrorMessage("El correo electrónico ya está registrado.");
        setLoading(false);
        return;
      }

      // 2. Registrar el usuario en la Autenticación de Supabase (Evita fallos de sesión)
      const { error: authError } = await supabase.auth.signUp({
        email: emailFormateado,
        password: password,
        options: {
          data: {
            nombre: nombre.trim(),
            apellido: apellido.trim(),
          },
        },
      });

      if (authError) {
        setErrorMessage(`Error en autenticación: ${authError.message}`);
        setLoading(false);
        return;
      }

      // 3. Encriptar contraseña para la tabla personalizada
      const hashedPassword = await bcrypt.hash(password, 10);

      // 4. Formatear días preferidos
      const diasString = preferredDays.length > 0 ? preferredDays.join(",") : "Sin especificar";

      // 5. Inserción correcta en la tabla usuario (insert antes de select)
      const { data: nuevoUsuario, error } = await supabase
        .from("usuario")
        .insert([
          {
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            correo: emailFormateado,
            telefono: telefono.trim(),
            fecha_nacimiento: fechaNacimiento,
            contrasena: hashedPassword,
            apodo: apodo.trim() || null,
            posicion_juego: position,
            dias_preferencia: diasString,
            turno_preferencia: preferredShift,
            rol: "Jugador",
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error Supabase usuario:", error);
        setErrorMessage(`Error al guardar datos del usuario: ${error.message}`);
        setLoading(false);
        return;
      }

      // 6. Guardar sesión local y redirigir
      if (nuevoUsuario) {
        localStorage.setItem(
          "userSession",
          JSON.stringify({
            id_usuario: nuevoUsuario.id_usuario,
            nombre: nuevoUsuario.nombre,
            correo: nuevoUsuario.correo,
          })
        );
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Ocurrió un error inesperado al registrar la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-between font-sans text-gray-800">
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

      <main className="flex-1 my-8 flex items-center justify-center px-4">
        <div className="w-full max-w-xl bg-white border border-gray-200 rounded-3xl p-8 shadow-sm flex flex-col items-center">
          <h1 className="text-2xl font-bold text-gray-900 text-center">
            Regístrate en <span className="text-green-600">DeUna!</span>
          </h1>

          {errorMessage && (
            <div className="w-full mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-medium">
              ⚠️ {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full space-y-6 mt-6">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-green-600 tracking-wider uppercase border-b border-gray-100 pb-1">
                Información Personal
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Mateo"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Apellido</label>
                  <input
                    type="text"
                    required
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    placeholder="Ej. Fernández"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder="mateo@ejemplo.com"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Teléfono (8 dígitos)</label>
                  <input
                    type="tel"
                    required
                    maxLength={8}
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ""))}
                    placeholder="71234567"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    required
                    value={fechaNacimiento}
                    onChange={(e) => setFechaNacimiento(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Apodo / Alias</label>
                  <input
                    type="text"
                    value={apodo}
                    onChange={(e) => setApodo(e.target.value)}
                    placeholder="Ej. El 10"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Contraseña</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Confirmar Contraseña</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold text-green-600 tracking-wider uppercase border-b border-gray-100 pb-1">
                Detalles del Jugador
              </h3>

              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-2">Posición Preferida</label>
                <div className="grid grid-cols-4 gap-2">
                  {["POR", "DFC", "MC", "DC"].map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => setPosition(pos)}
                      className={`p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition ${
                        position === pos ? "border-green-500 bg-emerald-50 text-green-700" : "border-gray-200 bg-white text-gray-600"
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-2">Días de Preferencia</label>
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {[
                    { key: "Lun", label: "L" },
                    { key: "Mar", label: "M" },
                    { key: "Mié", label: "X" },
                    { key: "Jue", label: "J" },
                    { key: "Vie", label: "V" },
                    { key: "Sáb", label: "S" },
                    { key: "Dom", label: "D" },
                  ].map((dayItem) => (
                    <button
                      key={dayItem.key}
                      type="button"
                      onClick={() => toggleDay(dayItem.key)}
                      className={`py-2 rounded-xl border text-xs font-bold cursor-pointer transition ${
                        preferredDays.includes(dayItem.key) ? "border-green-500 bg-emerald-50 text-green-700" : "border-gray-200 bg-white text-gray-600"
                      }`}
                    >
                      {dayItem.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-2">Turno de Preferencia</label>
                <div className="grid grid-cols-3 gap-2">
                  {["Mañana", "Tarde", "Noche"].map((shift) => (
                    <button
                      key={shift}
                      type="button"
                      onClick={() => setPreferredShift(shift)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                        preferredShift === shift ? "border-green-500 bg-emerald-50 text-green-700 font-bold" : "border-gray-200 bg-white text-gray-600"
                      }`}
                    >
                      {shift}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl text-xs transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? "GUARDANDO..." : "CREAR CUENTA →"}
            </button>
          </form>

          <div className="w-full mt-6">
            <button
              type="button"
              onClick={handleGoogleRegister}
              className="w-full py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continuar con Google</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}