"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/app/lib/supabase/client";

const usernamePattern = /^[a-zA-Z0-9_]{3,20}$/;

function calcularEdad(fechaNacimiento: string): string {
  if (!fechaNacimiento) return "";
  const hoy = new Date();
  const fechaNac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - fechaNac.getFullYear();
  const mes = hoy.getMonth() - fechaNac.getMonth();

  if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
    edad--;
  }

  return isNaN(edad) || edad < 0 ? "" : String(edad);
}

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<number | null>(null);

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    apodo: "",
    correo: "",
    telefono: "",
    fecha_nacimiento: "",
    posicion_juego: "",
    dias_preferencia: "",
    turno_preferencia: "",
  });

  const [originalForm, setOriginalForm] = useState(form);

  useEffect(() => {
    async function loadUserProfile() {
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

        setUserId(session.id_usuario);

        const { data: usuario, error: supabaseError } = await supabase
          .from("usuario")
          .select("*")
          .eq("id_usuario", session.id_usuario)
          .single();

        if (supabaseError || !usuario) {
          console.error("Error al cargar perfil:", supabaseError);
          setError("No se pudo cargar la información del perfil.");
          setLoading(false);
          return;
        }

        const fechaFormatted = usuario.fecha_nacimiento
          ? new Date(usuario.fecha_nacimiento).toISOString().split("T")[0]
          : "";

        const loadedData = {
          nombre: usuario.nombre || "",
          apellido: usuario.apellido || "",
          apodo: usuario.apodo || "",
          correo: usuario.correo || "",
          telefono: usuario.telefono || "",
          fecha_nacimiento: fechaFormatted,
          posicion_juego: usuario.posicion_juego || "",
          dias_preferencia: usuario.dias_preferencia || "",
          turno_preferencia: usuario.turno_preferencia || "",
        };

        setForm(loadedData);
        setOriginalForm(loadedData);
      } catch (err) {
        console.error("Error inesperado:", err);
        setError("Ocurrió un error al procesar los datos del perfil.");
      } finally {
        setLoading(false);
      }
    }

    loadUserProfile();
  }, [router, supabase]);

  function update(field: string, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleCancel() {
    setForm(originalForm);
    setIsEditing(false);
    setError("");
  }

  function validate() {
    if (!form.nombre.trim()) return "El nombre es obligatorio.";
    if (!form.apellido.trim()) return "El apellido es obligatorio.";
    if (form.apodo && !usernamePattern.test(form.apodo.replace(/^@/, ""))) {
      return "El apodo debe tener entre 3 y 20 caracteres (letras, números o guion bajo).";
    }
    return "";
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setSaving(true);
    setSaved(false);

    try {
      if (!userId) throw new Error("No hay un usuario autenticado.");

      const cleanApodo = form.apodo.trim().replace(/^@/, "");

      const { error: updateError } = await supabase
        .from("usuario")
        .update({
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          apodo: cleanApodo || null,
          telefono: form.telefono.trim() || null,
          fecha_nacimiento: form.fecha_nacimiento || null,
          posicion_juego: form.posicion_juego || null,
          dias_preferencia: form.dias_preferencia || null,
          turno_preferencia: form.turno_preferencia || null,
        })
        .eq("id_usuario", userId);

      if (updateError) throw updateError;

      const sessionString = localStorage.getItem("userSession");
      if (sessionString) {
        const session = JSON.parse(sessionString);
        session.nombre = form.nombre.trim();
        session.apellido = form.apellido.trim();
        session.apodo = cleanApodo;
        localStorage.setItem("userSession", JSON.stringify(session));
      }

      setOriginalForm(form);
      setIsEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3500);
    } catch (err: any) {
      setError(err.message || "Error al actualizar el perfil.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center font-sans">
        <p className="animate-pulse text-sm font-semibold text-emerald-400">
          Cargando perfil del jugador...
        </p>
      </div>
    );
  }

  const inicial = form.nombre ? form.nombre.charAt(0).toUpperCase() : "J";
  const edadCalculada = calcularEdad(form.fecha_nacimiento);

  const baseInputClass =
    "w-full rounded-xl border px-3.5 py-3 text-sm transition font-medium outline-none";
  const activeInputClass = `${baseInputClass} border-slate-200 bg-white text-slate-800 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20`;
  const disabledInputClass = `${baseInputClass} border-slate-100 bg-slate-50/70 text-slate-600 cursor-not-allowed`;

  return (
    <div className="mx-auto max-w-3xl space-y-6 font-sans text-slate-800">
      <div className="text-left">
        <h1 className="text-3xl font-black text-white tracking-tight">
          Perfil del Jugador
        </h1>
        <p className="mt-1 text-xs font-medium text-emerald-200/80">
          Actualiza tus datos para que los demás organizadores y jugadores te
          reconozcan en las canchas.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-3xl bg-white p-6 shadow-xl sm:p-8"
      >
        <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 border-2 border-emerald-500 text-2xl font-black text-emerald-800 shadow-sm">
            {inicial}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 capitalize">
              {form.nombre} {form.apellido}
            </h2>
            <p className="text-xs font-medium text-slate-500">{form.correo}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-bold text-slate-700">
            Nombre
            <input
              required
              disabled={!isEditing}
              value={form.nombre}
              onChange={(e) => update("nombre", e.target.value)}
              className={isEditing ? activeInputClass : disabledInputClass}
            />
          </label>

          <label className="text-xs font-bold text-slate-700">
            Apellido
            <input
              required
              disabled={!isEditing}
              value={form.apellido}
              onChange={(e) => update("apellido", e.target.value)}
              className={isEditing ? activeInputClass : disabledInputClass}
            />
          </label>

          <label className="text-xs font-bold text-slate-700">
            Apodo / Usuario
            <input
              disabled={!isEditing}
              value={form.apodo}
              onChange={(e) => update("apodo", e.target.value.replace(/^@/, ""))}
              placeholder="Ej: Perez"
              className={isEditing ? activeInputClass : disabledInputClass}
            />
            <span className="mt-1 block text-[11px] font-normal text-slate-400">
              Se mostrará como @{form.apodo || "apodo"}
            </span>
          </label>

          <label className="text-xs font-bold text-slate-700">
            Correo Electrónico
            <input
              disabled
              value={form.correo}
              className={disabledInputClass}
            />
          </label>

          <label className="text-xs font-bold text-slate-700">
            Celular / Teléfono
            <input
              type="tel"
              disabled={!isEditing}
              value={form.telefono}
              onChange={(e) => update("telefono", e.target.value)}
              placeholder="Sin teléfono registrado"
              className={isEditing ? activeInputClass : disabledInputClass}
            />
          </label>

          <label className="text-xs font-bold text-slate-700">
            Fecha de Nacimiento
            <input
              type="date"
              disabled={!isEditing}
              value={form.fecha_nacimiento}
              onChange={(e) => update("fecha_nacimiento", e.target.value)}
              className={isEditing ? activeInputClass : disabledInputClass}
            />
          </label>

          <label className="text-xs font-bold text-slate-700 sm:col-span-2">
            Edad (Calculada automáticamente)
            <input
              disabled
              value={
                edadCalculada ? `${edadCalculada} años` : "No especificada"
              }
              className={disabledInputClass}
            />
          </label>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <p className="mb-4 text-xs font-black uppercase tracking-wider text-emerald-600">
            Información Deportiva
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="text-xs font-bold text-slate-700">
              Posición Preferida
              <select
                disabled={!isEditing}
                value={form.posicion_juego}
                onChange={(e) => update("posicion_juego", e.target.value)}
                className={isEditing ? activeInputClass : disabledInputClass}
              >
                <option value="">Selecciona</option>
                <option value="POR">POR (Portero)</option>
                <option value="DFC">DFC (Defensa Central)</option>
                <option value="LI">LI (Lateral Izquierdo)</option>
                <option value="LD">LD (Lateral Derecho)</option>
                <option value="MC">MC (Mediocampista)</option>
                <option value="EI">EI (Extremo Izquierdo)</option>
                <option value="ED">ED (Extremo Derecho)</option>
                <option value="DC">DC (Delantero Centro)</option>
              </select>
            </label>

            <label className="text-xs font-bold text-slate-700">
              Días Preferidos
              <select
                disabled={!isEditing}
                value={form.dias_preferencia}
                onChange={(e) => update("dias_preferencia", e.target.value)}
                className={isEditing ? activeInputClass : disabledInputClass}
              >
                <option value="">Selecciona</option>
                <option value="Lun">Lunes</option>
                <option value="Mar">Martes</option>
                <option value="Mié">Miércoles</option>
                <option value="Jue">Jueves</option>
                <option value="Vie">Viernes</option>
                <option value="Sáb">Sábado</option>
                <option value="Dom">Domingo</option>
                <option value="Lun,Mié,Vie">Lun, Mié, Vie</option>
                <option value="Fin de semana">Fin de semana</option>
              </select>
            </label>

            <label className="text-xs font-bold text-slate-700">
              Turno Preferido
              <select
                disabled={!isEditing}
                value={form.turno_preferencia}
                onChange={(e) => update("turno_preferencia", e.target.value)}
                className={isEditing ? activeInputClass : disabledInputClass}
              >
                <option value="">Selecciona</option>
                <option value="Mañana">Mañana</option>
                <option value="Tarde">Tarde</option>
                <option value="Noche">Noche</option>
              </select>
            </label>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs font-bold text-red-600"
          >
            ⚠️ {error}
          </p>
        )}

        {saved && (
          <p
            role="status"
            className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-bold text-emerald-700"
          >
            ✅ ¡Perfil actualizado correctamente!
          </p>
        )}

        <div className="flex gap-3 pt-2">
          {isEditing && (
            <button
              type="button"
              onClick={handleCancel}
              className="w-1/3 rounded-xl border border-slate-300 py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
            >
              Cancelar
            </button>
          )}

          <button
            type="submit"
            disabled={saving}
            className={`w-full rounded-xl py-3.5 text-xs font-bold text-white transition active:scale-[0.99] shadow-md ${
              isEditing
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-slate-900 hover:bg-slate-800"
            }`}
          >
            {saving
              ? "Guardando..."
              : isEditing
              ? "Guardar Cambios"
              : "✏️ Editar Perfil"}
          </button>
        </div>
      </form>
    </div>
  );
}