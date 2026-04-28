import { useState } from "react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Thermometer, Drop, Flask, Sun, Fan, Warning } from "@phosphor-icons/react";
import WaterTube from "@/components/WaterTube";

const StatCard = ({ icon: Icon, label, value, unit, color, children }) => (
  <div
    className="rounded-2xl border p-5 flex flex-col"
    style={{ backgroundColor: "var(--ht-bg-surface)", borderColor: "rgba(19,42,27,0.1)", boxShadow: "0 4px 24px rgba(0,0,0,0.02)" }}
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
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          {warnings.map((w, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-2xl border-l-4 p-4"
              style={{ backgroundColor: "var(--ht-bg-surface)", borderLeftColor: w.color }}
            >
              <Warning size={20} weight="duotone" style={{ color: w.color }} />
              <span className="text-sm font-medium" style={{ color: "var(--ht-text-primary)" }}>{w.msg}</span>
            </div>
          ))}
        </motion.div>
      )}

      {/* Summary bar */}
      <div
        className="rounded-3xl border p-6"
        style={{ backgroundColor: "var(--ht-bg-surface)", borderColor: "rgba(19,42,27,0.1)", boxShadow: "0 4px 24px rgba(0,0,0,0.02)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs tracking-wider uppercase font-bold" style={{ color: "var(--ht-text-tertiary)" }}>Tent Overview</p>
            <p className="text-2xl font-medium mt-1" style={{ fontFamily: "Outfit, sans-serif", color: "var(--ht-text-primary)" }}>
              {growingCount} plant{growingCount !== 1 ? "s" : ""} growing
            </p>
          </div>
          <div className="flex items-center gap-4">
            <WaterTube level={status.water_level} color="var(--ht-water)" size="lg" />
            <WaterTube level={status.nutrient_level} color="var(--ht-nutrition)" size="lg" />
          </div>
        </div>
      </div>

      {/* Detailed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Thermometer} label="Temperature" value={status.temperature} unit="°C" color="var(--ht-harvest)">
          <Slider
            data-testid="temp-slider"
            value={[status.temperature]}
            onValueChange={([v]) => handleChange("temperature", Math.round(v * 10) / 10)}
            min={10} max={40} step={0.5}
            className="mt-2"
          />
          <div className="flex justify-between text-[10px] mt-1" style={{ color: "var(--ht-text-tertiary)" }}>
            <span>10°C</span><span>Optimal: 20-26°C</span><span>40°C</span>
          </div>
        </StatCard>

        <StatCard icon={Drop} label="Water Level" value={Math.round(status.water_level)} unit="%" color="var(--ht-water)">
          <Slider
            data-testid="water-slider"
            value={[status.water_level]}
            onValueChange={([v]) => handleChange("water_level", Math.round(v))}
            min={0} max={100} step={1}
            className="mt-2"
          />
          <div className="flex justify-between text-[10px] mt-1" style={{ color: "var(--ht-text-tertiary)" }}>
            <span>Empty</span><span>Full</span>
          </div>
        </StatCard>

        <StatCard icon={Flask} label="Nutrients" value={Math.round(status.nutrient_level)} unit="%" color="var(--ht-nutrition)">
          <Slider
            data-testid="nutrient-slider"
            value={[status.nutrient_level]}
            onValueChange={([v]) => handleChange("nutrient_level", Math.round(v))}
            min={0} max={100} step={1}
            className="mt-2"
          />
          <div className="flex justify-between text-[10px] mt-1" style={{ color: "var(--ht-text-tertiary)" }}>
            <span>Empty</span><span>Full</span>
          </div>
        </StatCard>

        <StatCard icon={Drop} label="pH Level" value={status.ph_level} unit="pH" color="var(--ht-brand-primary)">
          <Slider
            data-testid="ph-slider"
            value={[status.ph_level]}
            onValueChange={([v]) => handleChange("ph_level", Math.round(v * 10) / 10)}
            min={4} max={9} step={0.1}
            className="mt-2"
          />
          <div className="flex justify-between text-[10px] mt-1" style={{ color: "var(--ht-text-tertiary)" }}>
            <span>4.0 Acidic</span><span>Optimal: 5.5-7.0</span><span>9.0 Basic</span>
          </div>
        </StatCard>

        <StatCard icon={Sun} label="Light Hours" value={status.light_hours} unit="hrs/day" color="var(--ht-brand-accent)">
          <Slider
            data-testid="light-slider"
            value={[status.light_hours]}
            onValueChange={([v]) => handleChange("light_hours", Math.round(v))}
            min={0} max={24} step={1}
            className="mt-2"
          />
          <div className="flex justify-between text-[10px] mt-1" style={{ color: "var(--ht-text-tertiary)" }}>
            <span>0h</span><span>Optimal: 14-18h</span><span>24h</span>
          </div>
        </StatCard>

        <StatCard icon={Fan} label="Fan Speed" value={status.fan_speed} unit="level" color="var(--ht-text-secondary)">
          <Slider
            data-testid="fan-slider"
            value={[status.fan_speed]}
            onValueChange={([v]) => handleChange("fan_speed", Math.round(v))}
            min={0} max={5} step={1}
            className="mt-2"
          />
          <div className="flex justify-between text-[10px] mt-1" style={{ color: "var(--ht-text-tertiary)" }}>
            <span>Off</span><span>Max</span>
          </div>
        </StatCard>
      </div>
    </div>
  );
}
