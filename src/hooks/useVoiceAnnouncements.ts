import { useCallback } from "react";

interface VoiceSettings {
  enabled: boolean;
  voice: "male" | "female";
  speed: number;
  language: string;
}

function speakBrowser(text: string, opts?: { rate?: number; lang?: string }) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = opts?.lang || "en-IN";
  u.rate = opts?.rate ?? 1;
  window.speechSynthesis.speak(u);
}

export function useVoiceAnnouncements() {
  const defaultSettings: VoiceSettings = {
    enabled: true,
    voice: "female",
    speed: 1.0,
    language: "en-IN",
  };

  const getSettings = useCallback((): VoiceSettings => {
    try {
      const saved = localStorage.getItem("voiceSettings");
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  }, []);

  const saveSettings = useCallback(
    (settings: Partial<VoiceSettings>) => {
      try {
        const current = getSettings();
        localStorage.setItem("voiceSettings", JSON.stringify({ ...current, ...settings }));
      } catch (e) {
        console.warn("Failed to save voice settings:", e);
      }
    },
    [getSettings],
  );

  const speak = useCallback(
    async (text: string, options?: Partial<VoiceSettings>) => {
      const settings = getSettings();
      if (!settings.enabled) return;
      speakBrowser(text, {
        rate: options?.speed ?? settings.speed,
        lang: options?.language ?? settings.language,
      });
    },
    [getSettings],
  );

  const announceStudentPickup = useCallback(
    async (studentName: string, busNumber: string) => {
      const settings = getSettings();
      if (!settings.enabled) return;
      speakBrowser(`Pickup: ${studentName} for bus ${busNumber}.`);
    },
    [getSettings],
  );

  const announceStudentDropoff = useCallback(
    async (studentName: string) => {
      const settings = getSettings();
      if (!settings.enabled) return;
      speakBrowser(`Drop-off completed for ${studentName}.`);
    },
    [getSettings],
  );

  const announceEmergency = useCallback(
    async (busNumber: string) => {
      const settings = getSettings();
      if (!settings.enabled) return;
      speakBrowser(`Emergency alert for bus ${busNumber}.`);
    },
    [getSettings],
  );

  const announceBusArrival = useCallback(
    async (busNumber: string, eta: string) => {
      const settings = getSettings();
      if (!settings.enabled) return;
      speakBrowser(`Bus ${busNumber} estimated arrival ${eta}.`);
    },
    [getSettings],
  );

  const announceRouteStart = useCallback(
    async (busNumber: string, routeName: string) => {
      await speak(
        `Bus ${busNumber} is starting route ${routeName}. Students, please be ready at pickup points.`,
      );
    },
    [speak],
  );

  const announceRouteComplete = useCallback(
    async (busNumber: string) => {
      await speak(`Bus ${busNumber} has completed its route.`);
    },
    [speak],
  );

  const announceSpeedAlert = useCallback(
    async (currentSpeed: number, speedLimit: number) => {
      await speak(
        `Speed alert: ${currentSpeed} kilometers per hour exceeds limit ${speedLimit}. Please slow down.`,
        { speed: 0.85 },
      );
    },
    [speak],
  );

  const announceGeofenceAlert = useCallback(
    async (busNumber: string, location: string) => {
      await speak(`Bus ${busNumber} left the designated area near ${location}.`);
    },
    [speak],
  );

  return {
    speak,
    announceStudentPickup,
    announceStudentDropoff,
    announceEmergency,
    announceBusArrival,
    announceRouteStart,
    announceRouteComplete,
    announceSpeedAlert,
    announceGeofenceAlert,
    getSettings,
    saveSettings,
  };
}
