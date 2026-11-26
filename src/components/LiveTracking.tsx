"use client";

import { useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import { divIcon, type LatLngExpression } from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import { MdDirectionsBike } from "react-icons/md"

import styles from "./LiveTracking.module.css";
import { useRouter } from "next/navigation";
import { useSocket } from "@/context/SocketContext";

const trackingIcon = divIcon({
  className: styles.trackingMarker,
  html: renderToStaticMarkup(<MdDirectionsBike aria-hidden="true" />),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

type Location = {
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  timestamp?: string;
};

type LiveTrackingProps = {
  shipmentId: string;
  trackingNumber: string;
  onClose: () => void;
};

function FollowMarker({ location }: { location: Location }) {
  const map = useMap();
  useEffect(() => {
    map.setView([location.latitude, location.longitude]);
  }, [map, location.latitude, location.longitude]);

  return (
    <Marker
      icon={trackingIcon}
      position={[location.latitude, location.longitude]}
    />
  );
}

export default function LiveTracking({
  shipmentId,
  trackingNumber,
  onClose,
}: LiveTrackingProps) {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();
  const { connectSocket } = useSocket();

  useEffect(() => {
    let activeSocket: Awaited<ReturnType<typeof connectSocket>> | null = null;
    let cancelled = false;

    const joinShipment = () => {
      activeSocket?.emit("join-shipment", { shipmentId });
    };

    const receiveLocation = (data: { location?: Location }) => {
      if (data.location) setLocation(data.location);
    };

    const handleTrackingError = (data: { message?: string }) => {
      setError(data.message ?? "Unable to track this shipment.");
    };
    
    const handleConnectionError = () => {
      setError("Unable to connect to live tracking.");
    };

    void connectSocket()
      .then((sharedSocket) => {
        if (cancelled) return;
        activeSocket = sharedSocket;
        sharedSocket.on("connect", joinShipment);
        sharedSocket.on("receive-location", receiveLocation);
        sharedSocket.on("tracking-error", handleTrackingError);
        sharedSocket.on("connect_error", handleConnectionError);
        if (sharedSocket.connected) joinShipment();
      })
      .catch(() => {
        if (!cancelled) {
          setError("Your session has expired. Please sign in again.");
          router.push("/");
        }
      });

    return () => {
      cancelled = true;
      activeSocket?.off("connect", joinShipment);
      activeSocket?.off("receive-location", receiveLocation);
      activeSocket?.off("tracking-error", handleTrackingError);
      activeSocket?.off("connect_error", handleConnectionError);
    };
  }, [connectSocket, router, shipmentId]);

  const position: LatLngExpression = location
    ? [location.latitude, location.longitude]
    : [6.5244, 3.3792];

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Live shipment tracking"
    >
      <section className={styles.modal}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Live tracking</p>
            <h2>{trackingNumber}</h2>
            <p>
              {location
                ? "Driver location is updating in real time."
                : "Waiting for the driver to share a location..."}
            </p>
          </div>
          <button
            className={styles.close}
            onClick={onClose}
            type="button"
            aria-label="Close live tracking"
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
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {location && <FollowMarker location={location} />}
          </MapContainer>
        </div>
        <div className={styles.footer}>
          {error ? (
            <p className={styles.error}>{error}</p>
          ) : (
            <p>
              {location?.timestamp
                ? `Last update: ${new Date(location.timestamp).toLocaleString()}`
                : "Live connection active."}
            </p>
          )}
          <button onClick={onClose} type="button">
            Close
          </button>
        </div>
      </section>
    </div>
  );
}
