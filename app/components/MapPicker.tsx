"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapPickerProps {
  lat: number;
  lng: number;
  onSelectLocation: (lat: number, lng: number) => void;
}

export default function MapPicker({ lat, lng, onSelectLocation }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Fix de icono por defecto en Leaflet
    const defaultIcon = L.icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });

    if (!leafletMap.current) {
      // Inicializar el mapa
      const map = L.map(mapRef.current).setView([lat, lng], 14);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const marker = L.marker([lat, lng], { icon: defaultIcon, draggable: true }).addTo(map);

      // Evento al hacer clic en el mapa
      map.on("click", (e: L.LeafletMouseEvent) => {
        const { lat: newLat, lng: newLng } = e.latlng;
        marker.setLatLng([newLat, newLng]);
        onSelectLocation(newLat, newLng);
      });

      // Evento al arrastrar el pin
      marker.on("dragend", () => {
        const position = marker.getLatLng();
        onSelectLocation(position.lat, position.lng);
      });

      leafletMap.current = map;
      markerRef.current = marker;
    }

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  return <div ref={mapRef} className="h-64 w-full z-0" />;
}