import { useState } from "react";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Thermometer, Drop, Flask, Sun, Fan, Warning, ArrowUp, ArrowDown, Waves, Lightning } from "@phosphor-icons/react";

function ToggleCard({ icon: Icon, label, isOn, onToggle, color, testId }) {
  return (
    <div
      className="rounded-2xl border p-5 flex items-center justify-between transition-all duration-300"
      style={{
        backgroundColor: "var(--ht-bg-surface)",
        borderColor: isOn ? `${color}40` : "rgba(19,42,27,0.1)",
        boxShadow: isOn ? `0 0 20px ${color}10` : "0 2px 12px rgba(0,0,0,0.02)",
      }}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300"
          style={{ backgroundColor: isOn ? `${color}18` : "var(--ht-bg-secondary)" }}>
          <Icon size={22} weight="duotone" style={{ color: isOn ? color : "var(--ht-text-tertiary)" }} />
        </div>
        <div>
          <p className="text-sm font-medium" style={{ fontFamily: "Outfit, sans-serif", color: "var(--ht-text-primary)" }}>{label}</p>
          <p className="text-[10px] mt-0.5" style={{ color: isOn ? color : "var(--ht-text-tertiary)" }}>{isOn ? "Running" : "Off"}</p>
        </div>
      </div>
      <Switch data-testid={testId} checked={isOn} onCheckedChange={onToggle} />
    </div>
  );
}

/* ── Read-only sensor card (inspired by prototype) ── */
function SensorCard({ icon: Icon, label, value, unit, target, color, isWarning }) {
  return (
    <div
      className="rounded-2xl border p-5 flex flex-col items-center text-center transition-all duration-300"
      style={{
        backgroundColor: isWarning ? `${color}08` : "rgba(45,90,60,0.03)",
        borderColor: isWarning ? `${color}40` : "rgba(19,42,27,0.08)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
      }}
    >
      <span className="text-[10px] tracking-wider uppercase font-bold mb-3" style={{ color: "var(--ht-text-tertiary)" }}>
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-bold font-mono" style={{ color: "var(--ht-text-primary)" }}>
          {value}
        </span>
        <span className="text-sm" style={{ color: "var(--ht-text-tertiary)" }}>{unit}</span>
      </div>
      {target && (
        <span className="text-[10px] mt-2" style={{ color: "var(--ht-text-tertiary)" }}>
          Target: {target}
        </span>
      )}
      {isWarning && (
        <div className="flex items-center gap-1 mt-2">
          <Warning size={12} weight="fill" style={{ color }} />
          <span className="text-[10px] font-bold" style={{ color }}>Out of range</span>
        </div>
      )}
    </div>
  );
}

export default function ControlPanel({ tentStatus, plants, onUpdateStatus }) {
  const [localStatus, setLocalStatus] = useState(null);
  const status = localStatus || tentStatus;

  if (!status) {
    return <div className="text-center py-20" style={{ color: "var(--ht-text-tertiary)" }}>Loading tent data...</div>;
  }

  const handleChange = (key, val) => {
    const updated = { ...status, [key]: val };
    setLocalStatus(updated);
    onUpdateStatus(updated);
  };

  const growingCount = plants.filter((p) => p.status === "growing").length;

  return (
    <div className="space-y-6" data-testid="control-panel">
      {/* Overview */}
      <div className="rounded-3xl border p-6"
        style={{ backgroundColor: "var(--ht-bg-surface)", borderColor: "rgba(19,42,27,0.1)", boxShadow: "0 4px 24px rgba(0,0,0,0.02)" }}>
        <p className="text-xs tracking-wider uppercase font-bold" style={{ color: "var(--ht-text-tertiary)" }}>Tent Overview</p>
        <p className="text-2xl font-medium mt-1" style={{ fontFamily: "Outfit, sans-serif", color: "var(--ht-text-primary)" }}>
          {growingCount} plant{growingCount !== 1 ? "s" : ""} growing
        </p>
      </div>

      {/* Toggle Controls */}
      <div>
        <p className="text-xs tracking-wider uppercase font-bold mb-3" style={{ color: "var(--ht-text-tertiary)" }}>Controls</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ToggleCard icon={Sun} label="Grow Light" isOn={status.light_on} onToggle={(v) => handleChange("light_on", v)} color="#D4A017" testId="toggle-light" />
          <ToggleCard icon={Fan} label="Fan" isOn={status.fan_on} onToggle={(v) => handleChange("fan_on", v)} color="var(--ht-brand-primary)" testId="toggle-fan" />
        </div>
      </div>

      {/* pH Pump */}
      <div>
        <p className="text-xs tracking-wider uppercase font-bold mb-3" style={{ color: "var(--ht-text-tertiary)" }}>pH Pump</p>
        <div className="rounded-2xl border p-5" style={{ backgroundColor: "var(--ht-bg-surface)", borderColor: "rgba(19,42,27,0.1)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(45,90,60,0.08)" }}>
                <Drop size={22} weight="duotone" style={{ color: "var(--ht-brand-primary)" }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ fontFamily: "Outfit, sans-serif" }}>pH Pump Level</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--ht-text-tertiary)" }}>
                  Current: <span className="font-mono font-medium" style={{ color: "var(--ht-text-primary)" }}>{status.ph_pump_level}</span> / 5
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button data-testid="ph-pump-down" variant="outline" size="sm" className="rounded-full w-9 h-9 p-0 transition-all active:scale-90"
                onClick={() => handleChange("ph_pump_level", Math.max(0, (status.ph_pump_level || 0) - 1))} disabled={status.ph_pump_level <= 0}>
                <ArrowDown size={16} weight="bold" />
              </Button>
              <div className="flex gap-1 mx-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={`ph-seg-${i}`} className="w-3 h-6 rounded-sm transition-all duration-300"
                    style={{ backgroundColor: i < (status.ph_pump_level || 0) ? "var(--ht-brand-primary)" : "var(--ht-bg-secondary)" }} />
                ))}
              </div>
              <Button data-testid="ph-pump-up" variant="outline" size="sm" className="rounded-full w-9 h-9 p-0 transition-all active:scale-90"
                onClick={() => handleChange("ph_pump_level", Math.min(5, (status.ph_pump_level || 0) + 1))} disabled={status.ph_pump_level >= 5}>
                <ArrowUp size={16} weight="bold" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Live Sensor Data - read-only cards */}
      <div>
        <p className="text-xs tracking-wider uppercase font-bold mb-3" style={{ color: "var(--ht-text-tertiary)" }}>Live Sensor Data</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <SensorCard
            icon={Thermometer} label="Temperature"
            value={status.temperature} unit="°C"
            target="20-26°C"
            color="var(--ht-error)"
            isWarning={status.temperature > 30 || status.temperature < 15}
          />
          <SensorCard
            icon={Drop} label="Humidity"
            value={status.humidity} unit="%"
            target="40-60%"
            color="var(--ht-water)"
            isWarning={status.humidity < 30 || status.humidity > 80}
          />
          <SensorCard
            icon={Flask} label="pH Balance"
            value={status.ph_level} unit="pH"
            target="5.5-6.5"
            color="var(--ht-harvest)"
            isWarning={status.ph_level < 5.5 || status.ph_level > 7.0}
          />
          <SensorCard
            icon={Lightning} label="Nutrients (EC)"
            value={status.ec_level || 1.75} unit="mS/cm"
            target="1.2-2.0 mS/cm"
            color="var(--ht-nutrition)"
            isWarning={false}
          />
          <SensorCard
            icon={Sun} label="Light"
            value={status.light_lux || 639} unit="lux"
            target={null}
            color="#D4A017"
            isWarning={false}
          />
          <SensorCard
            icon={Waves} label="Water Flow"
            value={status.water_flow || 1.2} unit="L/h"
            target={null}
            color="var(--ht-water)"
            isWarning={false}
          />
        </div>
      </div>
    </div>
  );
}
