"use client";

import React, { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import OpenLayersMap from "./OpenLayersMap";
import MapControls from "./MapControls";
import BusInfoPanel from "./BusInfoPanel";
import type { BusMarkerProps } from "./BusMarker";
import "./map.css";

interface LiveOpenLayersMapProps {
  selectedBusId?: string;
  busLocations: BusMarkerProps[];
  routes: { id: string; name: string }[];
  error: string | null;
  isLoading: boolean;
}

const LiveOpenLayersMap: React.FC<LiveOpenLayersMapProps> = ({
  selectedBusId,
  busLocations,
  routes,
  error,
  isLoading,
}) => {
  const [selectedRoute, setSelectedRoute] = useState<string>("all");
  const [mapKey, setMapKey] = useState<number>(0);
  const [mapType, setMapType] = useState<"street" | "satellite">("street");

  const handleResetView = () => {
    setMapKey((prevKey) => prevKey + 1);
  };

  const handleMapTypeChange = (type: "street" | "satellite") => {
    setMapType(type);
  };

  return (
    <Card className="h-[calc(100vh-14rem)] min-h-[500px] w-full">
      <CardHeader className="pb-2">
        <MapControls
          routes={routes}
          selectedRoute={selectedRoute}
          onRouteChange={setSelectedRoute}
          onResetView={handleResetView}
          mapType={mapType}
          onMapTypeChange={handleMapTypeChange}
        />
      </CardHeader>
      <CardContent className="relative p-0" style={{ minHeight: "400px" }}>
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div className="flex h-full min-h-[400px] w-full items-center justify-center">
            <div className="w-3/4 space-y-2">
              <Skeleton className="mb-2 h-6 w-32" />
              <Skeleton className="h-[calc(100vh-18rem)] min-h-[400px] w-full rounded-md" />
            </div>
          </div>
        ) : (
          <div className="relative h-full min-h-[400px] w-full">
            <OpenLayersMap
              key={mapKey}
              busLocations={busLocations}
              selectedBusId={selectedBusId}
              mapType={mapType}
            />
            <BusInfoPanel buses={busLocations} selectedBusId={selectedBusId} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveOpenLayersMap;
