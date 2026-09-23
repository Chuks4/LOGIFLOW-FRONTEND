"use client";

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import { divIcon, type LatLngExpression } from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import { MdDirectionsBike } from "react-icons/md"

import { getValidAccessToken } from "@/services/axios/auth.service";
import styles from "./DriverLocationShare.module.css";

const sharingIcon = divIcon({
  className: styles.sharingMarker,
  html: renderToStaticMarkup(<MdDirectionsBike aria-hidden="true" />),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

type Location = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp: string;
};

type DriverLocationShareProps = {
  shipmentId: string;
  trackingNumber: string;
  onClose: () => void;
};

function socketUrl() {
  const apiUrl = process.env.NEXT_SOCKET_URL ?? "http://localhost:5000";
  return new URL(apiUrl).origin;
}

function FollowMarker({ location }: { location: Location }) {
  const map = useMap();

  useEffect(() => {
    map.setView([location.latitude, location.longitude]);
  }, [map, location.latitude, location.longitude]);

  return (
    <Marker
      icon={sharingIcon}
      position={[Number(location.latitude), Number(location.longitude)]}
    />
  );
}

export default function DriverLocationShare({
  shipmentId,
  trackingNumber,
  onClose,
}: DriverLocationShareProps) {
  const [location, setLocation] = useState<Location | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let socket: Socket | null = null;
    let watchId: number | null = null;
    let cancelled = false;

    function stopSharing() {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
      setIsSharing(false);
    }

    function shareLocation(position: GeolocationPosition) {
      const nextLocation: Location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed ?? undefined,
        heading: position.coords.heading ?? undefined,
        timestamp: new Date(position.timestamp).toISOString(),
      };

      setLocation(nextLocation);
      socket?.emit("send-location", { shipmentId, ...nextLocation });
    }

    function locationError(positionError: GeolocationPositionError) {
      setError(positionError.message || "Unable to read your location.");
      stopSharing();
    }

    function startSharing() {
      if (!navigator.geolocation) {
        setError("Location sharing is not supported by this browser.");
        return;
      }

      setError("");
      setIsSharing(true);
      watchId = navigator.geolocation.watchPosition(
        shareLocation,
        locationError,
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
      );
    }

    void getValidAccessToken()
      .then((token) => {
        if (cancelled) return;
        socket = io(socketUrl(), { auth: { token } });
        socket.on("connect_error", () => {
          setError("Unable to connect to location sharing.");
          setIsSharing(false);
        });
        socket.on("tracking-error", (data: { message?: string }) => {
          setError(data.message ?? "Unable to share this location.");
          setIsSharing(false);
        });
        socket.on("connect", startSharing);
      })
      .catch(() => {
        if (!cancelled)
          setError("Your session has expired. Please sign in again.");
      });

    return () => {
      cancelled = true;
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      socket?.disconnect();
    };
  }, [shipmentId]);

  const position: LatLngExpression = location
    ? [location.latitude, location.longitude]
    : [6.5244, 3.3792];

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <section className={styles.modal}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Driver location sharing</p>
            <h2>{trackingNumber}</h2>
            <p>
              {isSharing
                ? "Your location is being shared with the customer."
                : "Waiting for the secure location connection..."}
            </p>
          </div>
          <button
            aria-label="Close location sharing"
            className={styles.close}
            onClick={onClose}
            type="button"
          >
            x
          </button>
        </header>
        <div className={styles.map}>
          <MapContainer
            center={position}
            className={styles.mapContainer}
            scrollWheelZoom
            zoom={13}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {location && <FollowMarker location={location} />}
          </MapContainer>
        </div>
        <footer className={styles.footer}>
          {error ? (
            <p className={styles.error}>{error}</p>
          ) : (
            <p>
              {location
                ? `Last update: ${new Date(location.timestamp).toLocaleString()}`
                : "Waiting for your location..."}
            </p>
          )}
          <button onClick={onClose} type="button">
            Stop sharing
          </button>
        </footer>
      </section>
    </div>
  );
}
