"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { PLOTS, TASKS } from "@/lib/data";
import type { Plot } from "@/lib/types";

type Notice = { id: number; message: string; tone: "success" | "info" | "warning" };

type FarmContextValue = {
  plots: Plot[];
  addPlot: (plot: Plot) => void;
  updatePlot: (id: string, patch: Partial<Plot>) => void;
  doneTasks: string[];
  toggleTask: (id: string) => void;
  scheduled: Record<string, string>;
  schedulePlot: (id: string, label: string) => void;
  sunlight: boolean;
  toggleSunlight: () => void;
  notices: Notice[];
  notify: (message: string, tone?: Notice["tone"]) => void;
  dismissNotice: (id: number) => void;
};

const FarmContext = createContext<FarmContextValue | null>(null);

const STORAGE_KEY = "agripulse.state.v1";

type Persisted = {
  plots: Plot[];
  doneTasks: string[];
  scheduled: Record<string, string>;
  sunlight: boolean;
};

export function FarmProvider({ children }: { children: React.ReactNode }) {
  const [plots, setPlots] = useState<Plot[]>(PLOTS);
  const [doneTasks, setDoneTasks] = useState<string[]>(
    TASKS.filter((t) => t.done).map((t) => t.id),
  );
  const [scheduled, setScheduled] = useState<Record<string, string>>({});
  const [sunlight, setSunlight] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<Persisted>;
        if (saved.plots?.length) setPlots(saved.plots);
        if (saved.doneTasks) setDoneTasks(saved.doneTasks);
        if (saved.scheduled) setScheduled(saved.scheduled);
        if (typeof saved.sunlight === "boolean") setSunlight(saved.sunlight);
      }
    } catch {
      // Corrupted storage is non-fatal; fall back to the demo dataset.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ plots, doneTasks, scheduled, sunlight }),
      );
    } catch {
      // Private-mode storage can fail; the app still works for this session.
    }
  }, [hydrated, plots, doneTasks, scheduled, sunlight]);

  useEffect(() => {
    document.documentElement.classList.toggle("sunlight", sunlight);
  }, [sunlight]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV === "production") {
      const register = () => {
        navigator.serviceWorker.register("/sw.js").catch(() => undefined);
      };
      window.addEventListener("load", register);
      return () => window.removeEventListener("load", register);
    }

    // A production build served earlier on this origin may have registered the
    // service worker. It serves chunks cache-first, so leaving it active would
    // feed stale production assets to `next dev` and break hydration.
    const wasControlled = Boolean(navigator.serviceWorker.controller);
    if (!wasControlled) sessionStorage.removeItem("agripulse:sw-cleared");

    const cleanup = async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((key) => caches.delete(key)));
        }
        if (wasControlled && !sessionStorage.getItem("agripulse:sw-cleared")) {
          sessionStorage.setItem("agripulse:sw-cleared", "1");
          window.location.reload();
        }
      } catch {
        // Dev still works; the next hard reload retries the cleanup.
      }
    };

    void cleanup();
  }, []);

  const notify = useCallback(
    (message: string, tone: Notice["tone"] = "success") => {
      const id = Date.now() + Math.random();
      setNotices((prev) => [...prev, { id, message, tone }]);
      window.setTimeout(() => {
        setNotices((prev) => prev.filter((n) => n.id !== id));
      }, 4200);
    },
    [],
  );

  const dismissNotice = useCallback((id: number) => {
    setNotices((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addPlot = useCallback(
    (plot: Plot) => {
      setPlots((prev) => [...prev, plot]);
      notify(`${plot.name} added — ${plot.areaHa.toFixed(2)} ha mapped`);
    },
    [notify],
  );

  const updatePlot = useCallback((id: string, patch: Partial<Plot>) => {
    setPlots((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const toggleTask = useCallback((id: string) => {
    setDoneTasks((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }, []);

  const schedulePlot = useCallback(
    (id: string, label: string) => {
      setScheduled((prev) => ({ ...prev, [id]: label }));
      notify(`Irrigation scheduled — ${label}`);
    },
    [notify],
  );

  const toggleSunlight = useCallback(() => {
    setSunlight((prev) => !prev);
  }, []);

  const value = useMemo(
    () => ({
      plots,
      addPlot,
      updatePlot,
      doneTasks,
      toggleTask,
      scheduled,
      schedulePlot,
      sunlight,
      toggleSunlight,
      notices,
      notify,
      dismissNotice,
    }),
    [
      plots,
      addPlot,
      updatePlot,
      doneTasks,
      toggleTask,
      scheduled,
      schedulePlot,
      sunlight,
      toggleSunlight,
      notices,
      notify,
      dismissNotice,
    ],
  );

  return <FarmContext.Provider value={value}>{children}</FarmContext.Provider>;
}

export function useFarm() {
  const ctx = useContext(FarmContext);
  if (!ctx) throw new Error("useFarm must be used inside FarmProvider");
  return ctx;
}
