"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { createClient } from "@/app/lib/supabase/client";

const MapPicker = dynamic(() => import("@/app/components/MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 w-full items-center justify-center rounded-2xl bg-slate-100 text-xs font-semibold text-slate-400">
      🗺️ Cargando mapa...
    </div>
  ),
});

export default function NuevaCanchaPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [idPropietario, setIdPropietario] = useState<number | null>(null);
  const isFormLocked = loading || uploadingImage || success;

  const [form, setForm] = useState({
    nombre: "",
    ubicacion: "https://www.google.com/maps?q=-17.7833,-63.1821",
    tipo_juego: "Fútbol 5",
    precio: "",
    imagen: "",
    lat: -17.7833,
    lng: -63.1821,
  });

  useEffect(() => {
    const sessionString = localStorage.getItem("userSession");
    if (sessionString) {
      try {
        const session = JSON.parse(sessionString);
        if (session?.id_usuario) {
          setIdPropietario(session.id_usuario);
        }
      } catch (err) {
        console.error("Error al leer sesión:", err);
      }
    }
  }, []);

  function update(field: string, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleLocationSelect(lat: number, lng: number) {
    const mapsUrl = `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
    setForm((prev) => ({
      ...prev,
      lat,
      lng,
      ubicacion: mapsUrl,
    }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Error al subir la imagen");

      update("imagen", data.url);
    } catch (err: any) {
      setError("No se pudo subir la imagen: " + err.message);
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!form.nombre.trim() || !form.ubicacion.trim() || !form.precio) {
        throw new Error("Por favor completa los campos obligatorios.");
      }

      // 1. Insertar cancha con estado 'Pendiente'
      const { data: nuevaCancha, error: canchaError } = await supabase
        .from("cancha")
        .insert({
          id_propietario: idPropietario,
          nombre: form.nombre.trim(),
          ubicacion: form.ubicacion,
          tipo_juego: form.tipo_juego,
          precio: parseFloat(form.precio),
          imagen: form.imagen,
          estado: "Pendiente",
        })
        .select()
        .single();

      if (canchaError) {
        console.error("Error Supabase Cancha:", canchaError);
        throw new Error("Error al guardar cancha: " + canchaError.message);
      }

      // 2. Notificación para el usuario que creó la cancha
      if (idPropietario) {
        const { error: notifUserErr } = await supabase.from("notificacion").insert({
          id_usuario: idPropietario,
          titulo: "Cancha enviada a revisión ⏳",
          mensaje: `La cancha "${form.nombre.trim()}" fue mandada a revisión por el personal de mantenimiento.`,
          leido: false,
        });

        if (notifUserErr) {
          console.error("Error al notificar al propietario:", notifUserErr);
        }
      }

      // 3. Notificación para los usuarios con el rol 'mantenimiento'
      const { data: usuarios, error: userError } = await supabase
        .from("usuario")
        .select("id_usuario, rol");

      if (!userError && usuarios) {
        const mantenimientoUsers = usuarios.filter(
          (u) => u.rol && u.rol.trim().toLowerCase() === "mantenimiento"
        );

        if (mantenimientoUsers.length > 0) {
          const notifsMantenimiento = mantenimientoUsers.map((m) => ({
            id_usuario: m.id_usuario,
            titulo: "Nueva solicitud de cancha 🏟️",
            mensaje: `Se solicitó una nueva cancha: "${form.nombre.trim()}".`,
            leido: false,
          }));

          const { error: notifMantErr } = await supabase
            .from("notificacion")
            .insert(notifsMantenimiento);

          if (notifMantErr) {
            console.error("Error al notificar a mantenimiento:", notifMantErr);
          }
        }
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2500);
    } catch (err: any) {
      console.error("Error handleSubmit:", err);
      setError(err.message || "Error al registrar la cancha.");
    } finally {
      setLoading(false);
    }
  }

  const baseInputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition";

  return (
    <div className="mx-auto max-w-2xl space-y-6 font-sans text-slate-800">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">
          Solicitar Alta de Cancha
        </h1>
        <p className="mt-1 text-xs font-medium text-emerald-200/80">
          Haz clic en el mapa para fijar la ubicación exacta. Se enviará a revisión para su aprobación.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-3xl bg-white p-6 shadow-xl sm:p-8"
      >
        <div className="space-y-4">
          <label className="block text-xs font-bold text-slate-700">
            Nombre de la Cancha *
            <input
              type="text"
              required
              disabled={isFormLocked}
              placeholder="Ej: Cancha Sintética El Maracaná"
              value={form.nombre}
              onChange={(e) => update("nombre", e.target.value)}
              className={baseInputClass}
            />
          </label>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Selecciona la Ubicación en el Mapa (Haz clic para mover el pin 📍)
            </label>
            <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-inner">
              <MapPicker
                lat={form.lat}
                lng={form.lng}
                onSelectLocation={handleLocationSelect}
              />
            </div>
          </div>

          <label className="block text-xs font-bold text-slate-700">
            Dirección / Referencia (Enlace de Google Maps) *
            <input
              type="text"
              required
              readOnly
              value={form.ubicacion}
              className={`${baseInputClass} bg-slate-100 text-slate-600 font-mono text-xs`}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-bold text-slate-700">
              Tipo de Juego
              <select
                value={form.tipo_juego}
                disabled={isFormLocked}
                onChange={(e) => update("tipo_juego", e.target.value)}
                className={baseInputClass}
              >
                <option value="Fútbol 5">Fútbol 5</option>
                <option value="Fútbol 7">Fútbol 7</option>
                <option value="Fútbol 8">Fútbol 8</option>
                <option value="Fútbol 11">Fútbol 11</option>
                <option value="Futsal">Futsal</option>
              </select>
            </label>

            <label className="text-xs font-bold text-slate-700">
              Precio por Hora (Bs.) *
              <input
                type="number"
                required
                min="0"
                step="0.01"
                disabled={isFormLocked}
                placeholder="120"
                value={form.precio}
                onChange={(e) => update("precio", e.target.value)}
                className={baseInputClass}
              />
            </label>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Subir Imagen de la Cancha
            </label>
            <input
              type="file"
              accept="image/*"
              disabled={isFormLocked}
              onChange={handleImageUpload}
              className="block w-full text-xs text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-emerald-50 file:px-4 file:py-2.5 file:text-xs file:font-bold file:text-emerald-700 hover:file:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
            />
            {uploadingImage && (
              <p className="text-[11px] font-semibold text-emerald-600 animate-pulse">
                Subiendo imagen...
              </p>
            )}
            {form.imagen && (
              <p className="text-[11px] font-bold text-slate-600">
                ✅ Imagen guardada en: <code className="bg-slate-100 px-1 py-0.5 rounded">{form.imagen}</code>
              </p>
            )}
          </div>
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs font-bold text-red-600">
            ⚠️ {error}
          </p>
        )}

        {success && (
          <p className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-bold text-emerald-700">
            ✅ ¡Cancha enviada! Su cancha está en revisión y se notificó al personal de mantenimiento.
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isFormLocked}
            className="w-1/3 rounded-xl border border-slate-300 py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={isFormLocked}
            className="w-full rounded-xl bg-emerald-600 py-3.5 text-xs font-bold text-white transition hover:bg-emerald-700 active:scale-[0.99] shadow-md disabled:opacity-50"
          >
            {loading ? "Registrando..." : "📨 Registrar y Solicitar Verificación"}
          </button>
        </div>
      </form>
    </div>
  );
}