import { useState } from "react";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Thermometer, Drop, Flask, Sun, Fan, Warning, ArrowUp, ArrowDown } from "@phosphor-icons/react";

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
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300"
          style={{ backgroundColor: isOn ? `${color}18` : "var(--ht-bg-secondary)" }}
        >
          <Icon size={22} weight="duotone" style={{ color: isOn ? color : "var(--ht-text-tertiary)" }} />
        </div>
        <div>
          <p className="text-sm font-medium" style={{ fontFamily: "Outfit, sans-serif", color: "var(--ht-text-primary)" }}>{label}</p>
          <p className="text-[10px] mt-0.5" style={{ color: isOn ? color : "var(--ht-text-tertiary)" }}>
            {isOn ? "Running" : "Off"}
          </p>
        </div>
      </div>
      <Switch
        data-testid={testId}
        checked={isOn}
        onCheckedChange={onToggle}
      />
    </div>
  );
}

function LevelCard({ icon: Icon, label, value, unit, color, children }) {
  return (
    <div
      className="rounded-2xl border p-5 flex flex-col"
      style={{ backgroundColor: "var(--ht-bg-surface)", borderColor: "rgba(19,42,27,0.1)", boxShadow: "0 2px 12px rgba(0,0,0,0.02)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon size={18} weight="duotone" style={{ color }} />
        <span className="text-xs tracking-wider uppercase font-bold" style={{ color: "var(--ht-text-tertiary)" }}>{label}</span>
      </div>
      <div className="flex items-end gap-1 mb-2">
        <span className="text-3xl font-medium font-mono" style={{ color: "var(--ht-text-primary)" }}>{value}</span>
        <span className="text-sm mb-1" style={{ color: "var(--ht-text-tertiary)" }}>{unit}</span>
      </div>
      {children}
    </div>
  );
}

export default function ControlPanel({ tentStatus, plants, onUpdateStatus }) {
  const [localStatus, setLocalStatus] = useState(null);
  const status = localStatus || tentStatus;

  if (!status) {
    return (
      <div className="text-center py-20" style={{ color: "var(--ht-text-tertiary)" }}>
        Loading tent data...
      </div>
    );
  }

  const handleChange = (key, val) => {
    const updated = { ...status, [key]: val };
    setLocalStatus(updated);
    onUpdateStatus(updated);
  };

  const warnings = [];
  if (status.water_level < 30) warnings.push({ msg: "Water level is low! Refill soon.", color: "var(--ht-water)" });
  if (status.nutrient_level < 25) warnings.push({ msg: "Nutrient level is critically low!", color: "var(--ht-nutrition)" });
  if (status.temperature > 30) warnings.push({ msg: "Temperature is too high!", color: "var(--ht-error)" });
  if (status.temperature < 15) warnings.push({ msg: "Temperature is too low!", color: "var(--ht-error)" });
  if (status.ph_level < 5.5 || status.ph_level > 7.0) warnings.push({ msg: "pH level is out of optimal range (5.5-7.0)", color: "var(--ht-harvest)" });

  const growingCount = plants.filter((p) => p.status === "growing").length;

  return (
    <div className="space-y-6" data-testid="control-panel">
      {/* Warnings */}
      {warnings.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          {warnings.map((w) => (
            <div key={w.msg} className="flex items-center gap-3 rounded-2xl border-l-4 p-4"
              style={{ backgroundColor: "var(--ht-bg-surface)", borderLeftColor: w.color }}>
              <Warning size={20} weight="duotone" style={{ color: w.color }} />
              <span className="text-sm font-medium" style={{ color: "var(--ht-text-primary)" }}>{w.msg}</span>
            </div>
          ))}
        </motion.div>
      )}

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
          <ToggleCard
            icon={Sun}
            label="Grow Light"
            isOn={status.light_on}
            onToggle={(v) => handleChange("light_on", v)}
            color="#D4A017"
            testId="toggle-light"
          />
          <ToggleCard
            icon={Fan}
            label="Fan"
            isOn={status.fan_on}
            onToggle={(v) => handleChange("fan_on", v)}
            color="var(--ht-brand-primary)"
            testId="toggle-fan"
          />
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
              <Button
                data-testid="ph-pump-down"
                variant="outline"
                size="sm"
                className="rounded-full w-9 h-9 p-0 transition-all active:scale-90"
                onClick={() => handleChange("ph_pump_level", Math.max(0, (status.ph_pump_level || 0) - 1))}
                disabled={status.ph_pump_level <= 0}
              >
                <ArrowDown size={16} weight="bold" />
              </Button>
              <div className="flex gap-1 mx-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={`ph-seg-${i}`}
                    className="w-3 h-6 rounded-sm transition-all duration-300"
                    style={{
                      backgroundColor: i < (status.ph_pump_level || 0) ? "var(--ht-brand-primary)" : "var(--ht-bg-secondary)",
                    }}
                  />
                ))}
              </div>
              <Button
                data-testid="ph-pump-up"
                variant="outline"
                size="sm"
                className="rounded-full w-9 h-9 p-0 transition-all active:scale-90"
                onClick={() => handleChange("ph_pump_level", Math.min(5, (status.ph_pump_level || 0) + 1))}
                disabled={status.ph_pump_level >= 5}
              >
                <ArrowUp size={16} weight="bold" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Readings */}
      <div>
        <p className="text-xs tracking-wider uppercase font-bold mb-3" style={{ color: "var(--ht-text-tertiary)" }}>Readings</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <LevelCard icon={Thermometer} label="Temperature" value={status.temperature} unit="°C" color="var(--ht-harvest)">
            <Slider
              data-testid="temp-slider"
              value={[status.temperature]}
              onValueChange={([v]) => handleChange("temperature", Math.round(v * 10) / 10)}
              min={10} max={40} step={0.5} className="mt-2"
            />
            <div className="flex justify-between text-[10px] mt-1" style={{ color: "var(--ht-text-tertiary)" }}>
              <span>10°C</span><span>Optimal: 20-26°C</span><span>40°C</span>
            </div>
          </LevelCard>

          <LevelCard icon={Drop} label="Water Level" value={Math.round(status.water_level)} unit="%" color="var(--ht-water)">
            <Slider
              data-testid="water-slider"
              value={[status.water_level]}
              onValueChange={([v]) => handleChange("water_level", Math.round(v))}
              min={0} max={100} step={1} className="mt-2"
            />
            <div className="flex justify-between text-[10px] mt-1" style={{ color: "var(--ht-text-tertiary)" }}>
              <span>Empty</span><span>Full</span>
            </div>
          </LevelCard>

          <LevelCard icon={Flask} label="Nutrients" value={Math.round(status.nutrient_level)} unit="%" color="var(--ht-nutrition)">
            <Slider
              data-testid="nutrient-slider"
              value={[status.nutrient_level]}
              onValueChange={([v]) => handleChange("nutrient_level", Math.round(v))}
              min={0} max={100} step={1} className="mt-2"
            />
            <div className="flex justify-between text-[10px] mt-1" style={{ color: "var(--ht-text-tertiary)" }}>
              <span>Empty</span><span>Full</span>
            </div>
          </LevelCard>

          <LevelCard icon={Drop} label="pH Level" value={status.ph_level} unit="pH" color="var(--ht-brand-primary)">
            <Slider
              data-testid="ph-slider"
              value={[status.ph_level]}
              onValueChange={([v]) => handleChange("ph_level", Math.round(v * 10) / 10)}
              min={4} max={9} step={0.1} className="mt-2"
            />
            <div className="flex justify-between text-[10px] mt-1" style={{ color: "var(--ht-text-tertiary)" }}>
              <span>4.0 Acidic</span><span>Optimal: 5.5-7.0</span><span>9.0 Basic</span>
            </div>
          </LevelCard>
        </div>
      </div>
    </div>
  );
}
