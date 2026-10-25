"use client";

import { useState } from "react";
import {
  Bell,
  Check,
  Droplet,
  MapPin,
  Plug,
  RotateCcw,
  Satellite,
  Save,
  Settings2,
  Sun,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useFarm } from "@/providers/farm-provider";
import { FARM } from "@/lib/data";
import { cx } from "@/lib/format";

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx(
        "relative h-6 w-11 shrink-0 rounded-full transition",
        checked ? "bg-canopy-600" : "bg-[#d5dbd2]",
      )}
    >
      <span
        className={cx(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
          checked ? "left-[22px]" : "left-0.5",
        )}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { sunlight, toggleSunlight, notify } = useFarm();
  const [form, setForm] = useState({
    name: FARM.name,
    manager: FARM.manager,
    location: FARM.location,
    elevation: FARM.elevationM,
    source: FARM.waterSource,
  });
  const [prefs, setPrefs] = useState({
    efficiency: 85,
    window: "05:30",
    rainThreshold: 10,
  });
  const [integrations, setIntegrations] = useState({
    openMeteo: true,
    sentinel: true,
    iot: false,
    whatsapp: true,
    email: false,
  });

  function save() {
    notify("Farm settings saved for this device");
  }

  function reset() {
    try {
      window.localStorage.removeItem("agripulse.state.v1");
    } catch {
      // ignore
    }
    notify("Demo data reset — reloading", "info");
    window.setTimeout(() => window.location.reload(), 700);
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,1fr)]">
        <div className="space-y-5">
          {/* Farm profile */}
          <section className="card card-pad">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-canopy-50 text-canopy-700">
                <MapPin size={16} />
              </span>
              <div>
                <p className="eyebrow">Farm profile</p>
                <h2 className="font-display text-[16px] font-semibold tracking-[-0.02em]">
                  Identity & location
                </h2>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="farm-name">Farm name</label>
                <input
                  id="farm-name"
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="label" htmlFor="manager">Manager</label>
                <input
                  id="manager"
                  className="input"
                  value={form.manager}
                  onChange={(e) => setForm({ ...form, manager: e.target.value })}
                />
              </div>
              <div>
                <label className="label" htmlFor="location">Location</label>
                <input
                  id="location"
                  className="input"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>
              <div>
                <label className="label" htmlFor="elevation">Elevation (m)</label>
                <input
                  id="elevation"
                  type="number"
                  className="input"
                  value={form.elevation}
                  onChange={(e) => setForm({ ...form, elevation: Number(e.target.value) })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="source">Water source</label>
                <input
                  id="source"
                  className="input"
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-xl bg-sand-50 px-3 py-2.5">
              <div>
                <p className="text-[10.5px] font-medium">Field boundary</p>
                <p className="text-[9px] text-[#5f6e64]">61.4 ha mapped · WGS 84</p>
              </div>
              <a href="/fields" className="text-[10px] font-semibold text-canopy-700 hover:underline">
                Edit on map
              </a>
            </div>

            <button type="button" onClick={save} className="btn-primary mt-4">
              <Save size={14} /> Save profile
            </button>
          </section>

          {/* Irrigation defaults */}
          <section className="card card-pad">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <Droplet size={16} />
              </span>
              <div>
                <p className="eyebrow">Decision engine</p>
                <h2 className="font-display text-[16px] font-semibold tracking-[-0.02em]">
                  Irrigation defaults
                </h2>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <label className="label" htmlFor="pref-eff">Default efficiency</label>
                <div className="flex items-center gap-2">
                  <input
                    id="pref-eff"
                    type="range"
                    min={50}
                    max={98}
                    value={prefs.efficiency}
                    onChange={(e) => setPrefs({ ...prefs, efficiency: Number(e.target.value) })}
                    className="w-full"
                  />
                  <span className="w-9 text-right text-[11px] font-semibold">{prefs.efficiency}%</span>
                </div>
              </div>
              <div>
                <label className="label" htmlFor="pref-window">Preferred window</label>
                <input
                  id="pref-window"
                  type="time"
                  className="input"
                  value={prefs.window}
                  onChange={(e) => setPrefs({ ...prefs, window: e.target.value })}
                />
              </div>
              <div>
                <label className="label" htmlFor="pref-rain">Hold if rain ≥ (mm)</label>
                <input
                  id="pref-rain"
                  type="number"
                  min={0}
                  className="input"
                  value={prefs.rainThreshold}
                  onChange={(e) => setPrefs({ ...prefs, rainThreshold: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-canopy-50 px-3 py-2.5 text-[10px] leading-relaxed text-canopy-800">
              <span className="font-semibold">Current logic:</span> if more than{" "}
              {prefs.rainThreshold} mm of rain is forecast in the next 48 hours, irrigation is
              delayed and re-checked on the next model run.
            </div>
          </section>

          {/* Integrations */}
          <section className="card overflow-hidden">
            <div className="flex items-center gap-2.5 border-b border-[#eef0e9] px-5 py-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sand-100 text-[#415047]">
                <Plug size={16} />
              </span>
              <div>
                <p className="eyebrow">Connections</p>
                <h2 className="font-display text-[16px] font-semibold tracking-[-0.02em]">
                  Data & devices
                </h2>
              </div>
            </div>

            <ul className="divide-soft">
              {[
                {
                  key: "openMeteo" as const,
                  icon: Wifi,
                  title: "Open-Meteo",
                  detail: "2.5 km hourly forecast, ET₀ inputs",
                  status: "Connected",
                  ok: true,
                },
                {
                  key: "sentinel" as const,
                  icon: Satellite,
                  title: "Sentinel Hub",
                  detail: "Sentinel-2 L2A, 10 m NDVI tiles",
                  status: "Connected",
                  ok: true,
                },
                {
                  key: "iot" as const,
                  icon: WifiOff,
                  title: "Soil sensor gateway",
                  detail: "LoRa gateway · 3 probes expected",
                  status: "Not paired",
                  ok: false,
                },
              ].map((item) => (
                <li key={item.key} className="flex items-center gap-3 px-5 py-3.5">
                  <span
                    className={cx(
                      "flex h-8 w-8 items-center justify-center rounded-lg",
                      item.ok ? "bg-canopy-50 text-canopy-700" : "bg-sand-100 text-[#5f6e64]",
                    )}
                  >
                    <item.icon size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold">{item.title}</p>
                    <p className="text-[9.5px] text-[#5b6b61]">{item.detail}</p>
                  </div>
                  <span
                    className={cx(
                      "chip mr-1",
                      item.ok ? "bg-canopy-50 text-canopy-700" : "bg-sand-100 text-[#5f6e64]",
                    )}
                  >
                    {item.status}
                  </span>
                  <Toggle
                    checked={integrations[item.key]}
                    onChange={(next) => setIntegrations({ ...integrations, [item.key]: next })}
                    label={`Toggle ${item.title}`}
                  />
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Right rail */}
        <div className="space-y-5">
          <section className="card card-pad">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <Sun size={16} />
              </span>
              <div>
                <p className="eyebrow">Field readability</p>
                <h2 className="font-display text-[15px] font-semibold tracking-[-0.02em]">
                  Sunlight mode
                </h2>
              </div>
            </div>
            <p className="mt-2 text-[10.5px] leading-relaxed text-[#5b6b61]">
              Raises contrast, removes ambient shadows and darkens secondary text for direct
              sunlight. Also available from the top bar.
            </p>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-sand-50 px-3 py-2.5">
              <span className="text-[11px] font-semibold">{sunlight ? "On" : "Off"}</span>
              <Toggle checked={sunlight} onChange={toggleSunlight} label="Toggle sunlight mode" />
            </div>
          </section>

          <section className="card card-pad">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-canopy-50 text-canopy-700">
                <Bell size={16} />
              </span>
              <div>
                <p className="eyebrow">Notifications</p>
                <h2 className="font-display text-[15px] font-semibold tracking-[-0.02em]">
                  Alert channels
                </h2>
              </div>
            </div>
            <div className="mt-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium">WhatsApp</p>
                  <p className="text-[9px] text-[#5f6e64]">Daily plan + critical alerts</p>
                </div>
                <Toggle
                  checked={integrations.whatsapp}
                  onChange={(next) => setIntegrations({ ...integrations, whatsapp: next })}
                  label="Toggle WhatsApp alerts"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium">Email digest</p>
                  <p className="text-[9px] text-[#5f6e64]">Weekly water use report</p>
                </div>
                <Toggle
                  checked={integrations.email}
                  onChange={(next) => setIntegrations({ ...integrations, email: next })}
                  label="Toggle email digest"
                />
              </div>
            </div>
          </section>

          <section className="card card-pad">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sand-100 text-[#415047]">
                <Settings2 size={16} />
              </span>
              <div>
                <p className="eyebrow">Demo workspace</p>
                <h2 className="font-display text-[15px] font-semibold tracking-[-0.02em]">
                  Local data
                </h2>
              </div>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-[#5b6b61]">
              Plots, tasks and schedules are stored in this browser. Reset to restore the original
              five-plot demo farm.
            </p>
            <button type="button" onClick={reset} className="btn-secondary btn-sm mt-3 w-full">
              <RotateCcw size={12} /> Reset demo data
            </button>
          </section>

          <div className="rounded-2xl border border-canopy-200 bg-canopy-50 p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-canopy-800">
              <Check size={13} /> AgriPulse MVP v0.1
            </p>
            <p className="mt-1.5 text-[10px] leading-relaxed text-canopy-700">
              FAO-56 engine, geospatial plots, NDVI analytics and the irrigation planner are all
              running on the bundled demo dataset. Swap in PostGIS and live APIs for production.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
