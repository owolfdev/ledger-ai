"use client";

// File: components/examples/geolocation/geolocation-tracker.tsx

import React, { useState, useEffect } from "react";

interface GeolocationPositionCoords {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export default function GeolocationTracker() {
  const [coords, setCoords] = useState<GeolocationPositionCoords | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position: GeolocationPosition) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCoords({ latitude, longitude, accuracy });
      },
      (err: GeolocationPositionError) => {
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 10000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  if (error) {
    return <p>Error: {error}</p>;
  }

  if (!coords) {
    return <p>Getting location...</p>;
  }

  return (
    <div>
      <p>Latitude: {coords.latitude}</p>
      <p>Longitude: {coords.longitude}</p>
      <p>Accuracy: {coords.accuracy} meters</p>
    </div>
  );
}
