"use client";

import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { useEffect } from "react";
import type { LatLngExpression } from "leaflet";
import styles from "./CoordinateMap.module.css";

type CoordinateMapProps = {
  latitude?: number;
  longitude?: number;
  onSelect: (latitude: number, longitude: number) => void;
};

function MapClickHandler({ onSelect }: Pick<CoordinateMapProps, "onSelect">) {
  useMapEvents({
    click(event) {
      onSelect(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function MapViewport({ position }: { position: LatLngExpression }) {
  const map = useMap();

  useEffect(() => {
    map.setView(position);
  }, [map, position]);

  return null;
}

export default function CoordinateMap({
  latitude,
  longitude,
  onSelect,
}: CoordinateMapProps) {
  const position: LatLngExpression = [
    latitude ?? 6.5244,
    longitude ?? 3.3792,
  ];

  return (
    <div className={styles.map}>
      <MapContainer center={position} scrollWheelZoom className={styles.container} zoom={12}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapViewport position={position} />
        <MapClickHandler onSelect={onSelect} />
        {latitude !== undefined && longitude !== undefined && <Marker position={position} />}
      </MapContainer>
      <p>Click the map to select exact coordinates.</p>
    </div>
  );
}
