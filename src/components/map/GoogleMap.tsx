"use client";

import React, { useEffect, useRef, useState } from "react";
import type OlMap from "ol/Map";
import { freeMapService } from "@/services/freeMapService";
import type { DriverLocation, LocationPoint } from "@/services/mapTypes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MapPin, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface GoogleMapProps {
  drivers?: DriverLocation[];
  center?: LocationPoint;
  className?: string;
  showDriverInfo?: boolean;
  onDriverSelect?: (driver: DriverLocation) => void;
}

const GoogleMap: React.FC<GoogleMapProps> = ({
  drivers = [],
  center,
  className = "h-96 w-full",
  showDriverInfo = false,
  onDriverSelect,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const olMapRef = useRef<OlMap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const centerRef = useRef(center);
  centerRef.current = center;

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      if (!mapRef.current || olMapRef.current) return;
      try {
        setIsLoading(true);
        setError(null);
        const instance = await freeMapService.initializeMap(
          mapRef.current,
          centerRef.current ?? freeMapService.getSchoolLocation(),
        );
        if (cancelled) {
          freeMapService.destroyMap();
          return;
        }
        olMapRef.current = instance;
        setIsLoading(false);
        requestAnimationFrame(() => freeMapService.updateMapSize());
      } catch (err) {
        console.error("Map init error:", err);
        if (!cancelled) {
          setError("Failed to load map. Check your connection.");
          setIsLoading(false);
        }
      }
    };
    void init();
    return () => {
      cancelled = true;
      olMapRef.current = null;
      freeMapService.destroyMap();
    };
  }, []);

  useEffect(() => {
    if (isLoading || error || !center) return;
    freeMapService.setViewCenter(center, 14);
  }, [center?.lat, center?.lng, isLoading, error]);

  useEffect(() => {
    if (isLoading || error) return;
    freeMapService.clearMarkers();
    if (!drivers.length) {
      setTimeout(() => freeMapService.fitBoundsToMarkers(), 50);
      return;
    }
    void Promise.all(drivers.map((d) => freeMapService.addDriverMarker(d))).then(() => {
      setTimeout(() => freeMapService.fitBoundsToMarkers(), 80);
    });
  }, [drivers, isLoading, error]);

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex h-full items-center justify-center">
          <div className="text-center">
            <MapPin className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p className="text-red-500">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("flex min-h-0 flex-col overflow-hidden", className)}>
      <CardHeader className="shrink-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="h-5 w-5 shrink-0" />
          Live location (OpenStreetMap)
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        <div className="relative min-h-[220px] w-full flex-1">
          <div ref={mapRef} className="absolute inset-0 min-h-[220px] w-full bg-muted/30" />
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/85">
              <div className="text-center">
                <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading map…</p>
              </div>
            </div>
          )}
        </div>

        {showDriverInfo && drivers.length > 0 && (
          <div className="bg-muted/40 p-4">
            <h4 className="mb-2 font-medium">
              Active drivers ({drivers.filter((d) => d.isActive).length})
            </h4>
            <div className="max-h-40 space-y-2 overflow-y-auto">
              {drivers
                .filter((d) => d.isActive)
                .map((driver) => (
                  <div
                    key={driver.driverId}
                    className="flex cursor-pointer items-center justify-between rounded border bg-card p-2 hover:bg-muted/60"
                    onClick={() => onDriverSelect?.(driver)}
                  >
                    <div>
                      <p className="text-sm font-medium">{driver.driverName}</p>
                      <p className="text-xs text-muted-foreground">Bus: {driver.busNumber}</p>
                    </div>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {driver.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleMap;
