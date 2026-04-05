"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { randomUuid } from "@/utils/randomUuid";
import { isSecureBrowserContext, insecureContextHelpMessage } from "@/utils/browserFeatures";

interface QrScannerProps {
  onScan: (decodedText: string) => void;
  onError: (error: Error) => void;
  qrbox?: number;
  fps?: number;
}

function pickBackCameraId(devices: { id: string; label: string }[]): string | null {
  const back = devices.find((d) =>
    /back|rear|environment|wide|world|tele/i.test(d.label),
  );
  return (back ?? devices[0])?.id ?? null;
}

const QrScanner: React.FC<QrScannerProps> = ({ onScan, onError, qrbox = 250, fps = 10 }) => {
  const [scannerElementId] = useState(() => `html5-qr-${randomUuid().slice(0, 10)}`);
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [insecure, setInsecure] = useState(false);

  useEffect(() => {
    setInsecure(typeof window !== "undefined" && !isSecureBrowserContext());
  }, []);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode(scannerElementId, { verbose: false });
    setScanner(html5QrCode);

    return () => {
      const clearDom = () => {
        try {
          html5QrCode.clear();
        } catch {
          /* clear() is synchronous void — not a Promise */
        }
      };
      if (html5QrCode.isScanning) {
        void html5QrCode.stop().catch(() => {}).finally(clearDom);
      } else {
        clearDom();
      }
    };
  }, [scannerElementId]);

  const startScanner = useCallback(async () => {
    if (!scanner) return;

    if (!isSecureBrowserContext()) {
      const msg = insecureContextHelpMessage();
      setCameraError(msg);
      onError(new Error(msg));
      return;
    }

    setCameraError(null);
    setScanning(true);

    const scanConfig = {
      fps,
      qrbox: { width: Math.min(qrbox, 280), height: Math.min(qrbox, 280) },
      aspectRatio: 1,
      disableFlip: false,
    };

    const tryStart = async (camera: string | MediaTrackConstraints) => {
      await scanner.start(
        camera,
        scanConfig,
        (decodedText) => {
          void scanner.stop().then(() => setScanning(false)).catch(() => setScanning(false));
          onScan(decodedText);
        },
        () => {},
      );
    };

    try {
      // Many mobile WebViews reject { ideal: "environment" }; use a string or { exact: ... } only.
      await tryStart({ facingMode: "environment" });
    } catch (firstErr) {
      console.warn("QR camera (environment string):", firstErr);
      try {
        await tryStart({ facingMode: { exact: "environment" } });
        return;
      } catch (exactEnvErr) {
        console.warn("QR camera (environment exact):", exactEnvErr);
      }
      try {
        const devices = await Html5Qrcode.getCameras();
        const id = pickBackCameraId(devices);
        if (id) {
          await tryStart(id);
          return;
        }
      } catch (enumErr) {
        console.warn("QR getCameras:", enumErr);
      }
      try {
        await tryStart({ facingMode: "user" });
      } catch (frontErr) {
        console.warn("QR camera (user):", frontErr);
        try {
          const devices = await Html5Qrcode.getCameras();
          if (devices.length > 0) {
            await tryStart(devices[0].id);
            return;
          }
        } catch {
          /* fall through */
        }
        setScanning(false);
        const raw = firstErr instanceof Error ? firstErr.message : String(firstErr);
        let friendly = "Could not open the camera.";
        if (/Permission|NotAllowed|denied/i.test(raw)) {
          friendly = "Camera permission denied. Tap the lock icon in the address bar and allow Camera, then try again.";
        } else if (/NotFound|DevicesNotFound/i.test(raw)) {
          friendly = "No camera found on this device.";
        }
        setCameraError(friendly);
        onError(firstErr instanceof Error ? firstErr : new Error(raw));
      }
    }
  }, [scanner, onScan, onError, fps, qrbox]);

  const stopScanner = () => {
    if (scanner?.isScanning) {
      scanner
        .stop()
        .then(() => setScanning(false))
        .catch(() => setScanning(false));
    }
  };

  return (
    <div className="flex w-full flex-col items-center justify-center gap-4">
      {insecure && (
        <Alert variant="destructive" className="text-left">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>HTTPS required on phone</AlertTitle>
          <AlertDescription className="text-sm">
            {insecureContextHelpMessage()}
          </AlertDescription>
        </Alert>
      )}

      <div
        id={scannerElementId}
        className="aspect-square w-full max-w-sm overflow-hidden rounded-lg border border-border bg-muted/40"
      />

      {cameraError && !insecure && (
        <p className="p-2 text-center text-sm text-destructive">{cameraError}</p>
      )}

      <div className="flex flex-wrap justify-center gap-2">
        {!scanning ? (
          <Button
            type="button"
            onClick={() => void startScanner()}
            className="bg-sishu-primary hover:bg-blue-700"
            disabled={insecure}
          >
            Start camera
          </Button>
        ) : (
          <Button type="button" onClick={stopScanner} variant="outline">
            Stop camera
          </Button>
        )}
      </div>
    </div>
  );
};

export default QrScanner;
