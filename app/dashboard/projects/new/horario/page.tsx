"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/app/lib/supabase/client";

interface ProductoTercerTiempo {
  nombre_producto: string;
  precio_unitario: number;
  categoria: string;
}

function ConfigurarCanchaContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const idCancha = searchParams.get("id_cancha");

  // Estado Cancha
  const [nombreCancha, setNombreCancha] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Estado Disponibilidad (Por defecto 60 min = 1 hora)
  const [diasSeleccionados, setDiasSeleccionados] = useState<string[]>([]);
  const [horaApertura, setHoraApertura] = useState<string>("08:00");
  const [horaCierre, setHoraCierre] = useState<string>("23:00");
  const [duracionTurno, setDuracionTurno] = useState<number>(60);

  // Estado Tercer Tiempo
  const [ofreceTercerTiempo, setOfreceTercerTiempo] = useState<boolean>(false);
  const [productos, setProductos] = useState<ProductoTercerTiempo[]>([]);
  const [nuevoProducto, setNuevoProducto] = useState<ProductoTercerTiempo>({
    nombre_producto: "",
    precio_unitario: 0,
    categoria: "Bebidas",
  });

  const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

  useEffect(() => {
    if (idCancha) {
      cargarDatosCancha();
    }
  }, [idCancha]);

  async function cargarDatosCancha() {
    setLoading(true);
    try {
      const idCanchaNum = Number(idCancha);

      // 1. Obtener nombre de la cancha
      const { data: canchaData } = await supabase
        .from("cancha")
        .select("nombre")
        .eq("id_cancha", idCanchaNum)
        .single();

      if (canchaData) setNombreCancha(canchaData.nombre);

      // 2. Obtener las disponibilidades actuales asociadas a la cancha
      const { data: disponibilidades } = await supabase
        .from("disponibilidaddecancha")
        .select("id_disponibilidad")
        .eq("id_cancha", idCanchaNum);

      if (disponibilidades && disponibilidades.length > 0) {
        const idsDisponibilidad = disponibilidades.map((d) => d.id_disponibilidad);

        // 3. Obtener los productos de Tercer Tiempo ligados a esas disponibilidades
        const { data: ttData, error: errTT } = await supabase
          .from("tercertiempo")
          .select("nombre_producto, precio_unitario")
          .in("id_disponibilidad", idsDisponibilidad);

        if (errTT) {
          console.error("Error consultando tercertiempo:", errTT);
        }

        if (ttData && ttData.length > 0) {
          setOfreceTercerTiempo(true);

          // Agrupar y desduplicar productos cargados
          const unicos = new Map<string, ProductoTercerTiempo>();

          ttData.forEach((item) => {
            let cat = "Otros";
            let nombre = item.nombre_producto || "";

            if (nombre.startsWith("[")) {
              const cierreCorchete = nombre.indexOf("]");
              if (cierreCorchete !== -1) {
                cat = nombre.substring(1, cierreCorchete);
                nombre = nombre.substring(cierreCorchete + 1).trim();
              }
            }

            const clave = `${cat}-${nombre}-${item.precio_unitario}`;
            if (!unicos.has(clave)) {
              unicos.set(clave, {
                nombre_producto: nombre,
                precio_unitario: Number(item.precio_unitario) || 0,
                categoria: cat,
              });
            }
          });

          setProductos(Array.from(unicos.values()));
        }
      }
    } catch (err) {
      console.error("Error al cargar datos:", err);
    } finally {
      setLoading(false);
    }
  }

  const toggleDia = (dia: string) => {
    setDiasSeleccionados((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]
    );
  };

  const seleccionarTodosDias = () => {
    if (diasSeleccionados.length === diasSemana.length) {
      setDiasSeleccionados([]);
    } else {
      setDiasSeleccionados([...diasSemana]);
    }
  };

  const agregarProducto = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();

    if (!nuevoProducto.nombre_producto.trim()) {
      alert("Por favor ingresa un nombre o descripción para la oferta.");
      return;
    }

    if (Number(nuevoProducto.precio_unitario) <= 0) {
      alert("Por favor ingresa un precio válido mayor a 0.");
      return;
    }

    setProductos((prev) => [
      ...prev,
      {
        nombre_producto: nuevoProducto.nombre_producto.trim(),
        precio_unitario: Number(nuevoProducto.precio_unitario),
        categoria: nuevoProducto.categoria,
      },
    ]);

    setNuevoProducto({
      nombre_producto: "",
      precio_unitario: 0,
      categoria: "Bebidas",
    });
  };

  const eliminarProducto = (index: number) => {
    setProductos((prev) => prev.filter((_, i) => i !== index));
  };

  const guardarConfiguracionCompleta = async () => {
    if (!idCancha) {
      alert("No se encontró el ID de la cancha.");
      return;
    }

    if (diasSeleccionados.length === 0) {
      alert("Por favor selecciona al menos un día habilitado para la disponibilidad.");
      return;
    }

    // --- VALIDACIÓN DE DURACIÓN DEL TURNO ---
    if (duracionTurno !== 60 && duracionTurno !== 120) {
      alert("La duración del turno solo puede ser de 1 hora (60 min) o 2 horas (120 min).");
      return;
    }

    // --- VALIDACIÓN: Horarios vs Duración del Turno ---
    const [hIni, mIni] = horaApertura.split(":").map(Number);
    const [hFin, mFin] = horaCierre.split(":").map(Number);

    const totalMinutosApertura = hIni * 60 + mIni;
    const totalMinutosCierre = hFin * 60 + mFin;
    const tiempoDisponibleTotal = totalMinutosCierre - totalMinutosApertura;

    if (tiempoDisponibleTotal <= 0) {
      alert("La hora de cierre debe ser posterior a la hora de apertura.");
      return;
    }

    if (tiempoDisponibleTotal < duracionTurno) {
      alert(
        `El rango de tiempo entre apertura (${horaApertura}) y cierre (${horaCierre}) es de ${tiempoDisponibleTotal} minutos, lo cual es menor a la duración seleccionada del turno (${duracionTurno / 60} hora/s). Por favor ajusta los horarios.`
      );
      return;
    }

    setSaving(true);
    try {
      const idCanchaNum = Number(idCancha);

      // --- GENERACIÓN DE BLOQUES CON TIEMPO DE ESPERA (30 MIN) ---
      const nuevosBloques = [];
      const TIEMPO_ESPERA_MINUTOS = 30;

      for (const dia of diasSeleccionados) {
        let minutosInicioTotal = totalMinutosApertura;

        while (minutosInicioTotal + duracionTurno <= totalMinutosCierre) {
          const hActual = Math.floor(minutosInicioTotal / 60);
          const mActual = minutosInicioTotal % 60;

          const minFinBloque = minutosInicioTotal + duracionTurno;
          const hFinBloque = Math.floor(minFinBloque / 60);
          const mFinBloque = minFinBloque % 60;

          const strInicio = `${String(hActual).padStart(2, "0")}:${String(mActual).padStart(2, "0")}:00`;
          const strFin = `${String(hFinBloque).padStart(2, "0")}:${String(mFinBloque).padStart(2, "0")}:00`;

          nuevosBloques.push({
            id_cancha: idCanchaNum,
            dia_semana: dia,
            hora_inicio: strInicio,
            hora_fin: strFin,
            esta_ocupada: false,
          });

          // Incremento: Duración del turno + 30 min de espera
          minutosInicioTotal += duracionTurno + TIEMPO_ESPERA_MINUTOS;
        }
      }

      // PASO 1: Obtener disponibilidades antiguas para eliminar sus registros en tercertiempo primero
      const { data: disponibilidadesAntiguas } = await supabase
        .from("disponibilidaddecancha")
        .select("id_disponibilidad")
        .eq("id_cancha", idCanchaNum);

      if (disponibilidadesAntiguas && disponibilidadesAntiguas.length > 0) {
        const idsViejos = disponibilidadesAntiguas.map((d) => d.id_disponibilidad);
        await supabase.from("tercertiempo").delete().in("id_disponibilidad", idsViejos);
      }

      // PASO 2: Eliminar disponibilidades previas de la cancha
      const { error: errorDelDisp } = await supabase
        .from("disponibilidaddecancha")
        .delete()
        .eq("id_cancha", idCanchaNum);

      if (errorDelDisp) throw errorDelDisp;

      // PASO 3: Insertar los nuevos bloques de disponibilidad y capturar sus id_disponibilidad
      let disponibilidadesCreadas: { id_disponibilidad: number }[] = [];

      if (nuevosBloques.length > 0) {
        const { data: creados, error: errorDisp } = await supabase
          .from("disponibilidaddecancha")
          .insert(nuevosBloques)
          .select("id_disponibilidad");

        if (errorDisp) {
          console.error("❌ Error al insertar disponibilidades:", errorDisp);
          alert(`Error en disponibilidades: ${errorDisp.message}`);
          setSaving(false);
          return;
        }

        if (!creados || creados.length === 0) {
          alert("Error: No se pudieron generar las disponibilidades en la base de datos.");
          setSaving(false);
          return;
        }

        disponibilidadesCreadas = creados;
      }

      // PASO 4: Guardar Ofertas de Tercer Tiempo directamente asociadas a cada id_disponibilidad
      if (ofreceTercerTiempo && productos.length > 0 && disponibilidadesCreadas.length > 0) {
        const registrosTT: {
          id_disponibilidad: number;
          nombre_producto: string;
          precio_unitario: number;
          cantidad: number;
        }[] = [];

        disponibilidadesCreadas.forEach((disp) => {
          productos.forEach((p) => {
            registrosTT.push({
              id_disponibilidad: disp.id_disponibilidad,
              nombre_producto: `[${p.categoria}] ${p.nombre_producto}`,
              precio_unitario: p.precio_unitario,
              cantidad: 1,
            });
          });
        });

        const { data, error: errorTT } = await supabase
          .from("tercertiempo")
          .insert(registrosTT)
          .select();

        if (errorTT) {
          console.error("❌ ERROR COMPLETO SUPABASE TERCER TIEMPO:", errorTT);
          alert(`Error al guardar en Tercer Tiempo: ${errorTT.message} (Código: ${errorTT.code})`);
          setSaving(false);
          return;
        }

        console.log("✅ Registros creados exitosamente en tercertiempo:", data);
      }

      alert("¡Configuración guardada exitosamente!");
      router.push("/dashboard/projects");
    } catch (err: any) {
      console.error("Error al guardar:", err);
      alert(`Ocurrió un error al guardar: ${err?.message || "Error desconocido"}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm font-bold text-slate-700">
        Cargando configuración...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6 text-slate-700">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
          GESTIÓN DE CANCHA VALIDADA
        </span>
        <h1 className="text-3xl font-black text-slate-900">Configurar Disponibilidad y Servicios</h1>
        <p className="text-xs text-slate-500">
          Cancha: <span className="font-bold text-slate-800">{nombreCancha || `#${idCancha}`}</span>
        </p>
      </div>

      <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl backdrop-blur-md">
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
          📅 1. Disponibilidad de Horarios
        </h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-600">Días Habilitados:</label>
            <button
              type="button"
              onClick={seleccionarTodosDias}
              className="text-xs font-bold text-emerald-600 hover:underline"
            >
              {diasSeleccionados.length === diasSemana.length ? "Desmarcar todos" : "Seleccionar todos"}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {diasSemana.map((dia) => {
              const seleccionado = diasSeleccionados.includes(dia);
              return (
                <button
                  key={dia}
                  type="button"
                  onClick={() => toggleDia(dia)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition border ${
                    seleccionado
                      ? "bg-emerald-600 text-white border-emerald-500 shadow"
                      : "bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900"
                  }`}
                >
                  {dia}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600">Hora de Apertura:</label>
            <input
              type="time"
              value={horaApertura}
              onChange={(e) => setHoraApertura(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600">Hora de Cierre:</label>
            <input
              type="time"
              value={horaCierre}
              onChange={(e) => setHoraCierre(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-600">
            Duración del turno (incluye 30 min de espera entre turnos):
          </label>
          <select
            value={duracionTurno}
            onChange={(e) => setDuracionTurno(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value={60}>1 Hora (60 Minutos)</option>
            <option value={120}>2 Horas (120 Minutos)</option>
          </select>
        </div>
      </section>

      <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            🍺 2. Oferta Tercer Tiempo
          </h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={ofreceTercerTiempo}
              onChange={(e) => setOfreceTercerTiempo(e.target.checked)}
              className="h-4 w-4 rounded accent-emerald-600 cursor-pointer"
            />
            <span className="text-xs font-bold text-emerald-600">
              Ofrece servicios de Tercer Tiempo
            </span>
          </label>
        </div>

        {ofreceTercerTiempo && (
          <div className="space-y-4 pt-2 border-t border-slate-200">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
              <div className="sm:col-span-3">
                <select
                  value={nuevoProducto.categoria}
                  onChange={(e) => setNuevoProducto({ ...nuevoProducto, categoria: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Bebidas">🍺 Bebidas</option>
                  <option value="Comida">🍔 Comida</option>
                  <option value="Churrasco">🥩 Churrascos</option>
                  <option value="Otros">🍿 Otros</option>
                </select>
              </div>

              <div className="sm:col-span-5">
                <input
                  type="text"
                  placeholder="Nombre/Descripción (Ej: Paceña 620ml, Churrasco)"
                  value={nuevoProducto.nombre_producto}
                  onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre_producto: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-3">
                <input
                  type="number"
                  placeholder="Precio (Bs.)"
                  value={nuevoProducto.precio_unitario || ""}
                  onChange={(e) =>
                    setNuevoProducto({
                      ...nuevoProducto,
                      precio_unitario: e.target.value === "" ? 0 : Number(e.target.value),
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-1">
                <button
                  type="button"
                  onClick={agregarProducto}
                  className="w-full h-full min-h-[38px] flex items-center justify-center rounded-xl bg-emerald-600 text-base font-bold text-white hover:bg-emerald-500 transition active:scale-95"
                >
                  +
                </button>
              </div>
            </div>

            {productos.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-semibold text-slate-500">
                  Ofertas añadidas ({productos.length}):
                </p>
                <div className="grid gap-2">
                  {productos.map((prod, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs border border-slate-200"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-600">[{prod.categoria}]</span>
                        <span className="text-slate-700">{prod.nombre_producto}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-slate-800">Bs. {prod.precio_unitario}</span>
                        <button
                          type="button"
                          onClick={() => eliminarProducto(index)}
                          className="text-red-500 hover:text-red-600 text-xs px-2 py-1 rounded bg-slate-200"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <button
        type="button"
        onClick={guardarConfiguracionCompleta}
        disabled={saving}
        className="w-full rounded-2xl bg-[#f95721] py-4 text-sm font-bold text-white shadow-lg transition hover:bg-[#e04816] active:scale-[0.99] disabled:opacity-50"
      >
        {saving ? "Guardando en BD..." : "💾 Guardar Configuración Completa"}
      </button>
    </div>
  );
}

export default function HorariosYServiciosPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-white">Cargando interfaz...</div>}>
      <ConfigurarCanchaContent />
    </Suspense>
  );
}