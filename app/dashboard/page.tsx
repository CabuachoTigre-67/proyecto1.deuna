"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const sessionString = localStorage.getItem("userSession");

    if (!sessionString) {
      router.replace("/login");
      return;
    }

    try {
      const session = JSON.parse(sessionString);
      const rol = String(session?.rol || "").trim().toLowerCase();

      switch (rol) {
        case "administrador":
        case "admin":
          router.replace("/dashboard/administrador");
          break;
        case "mantenimiento":
          router.replace("/dashboard/mantenimiento");
          break;
        case "jugador":
        default:
          router.replace("/dashboard/jugador");
          break;
      }
    } catch (err) {
      console.error("Error al leer la sesión:", err);
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="flex h-64 items-center justify-center text-white">
      <p className="animate-pulse text-sm font-semibold">Cargando tu panel...</p>
    </div>
  );
}