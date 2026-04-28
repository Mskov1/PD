import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash, Plant, Scissors, Timer, Leaf, FlowerTulip, PottedPlant } from "@phosphor-icons/react";

const ICON_MAP = {
  leaf: Leaf,
  plant: Plant,
  flower: FlowerTulip,
  herb: PottedPlant,
};

export default function PlantCard({ plant, onRemove, onHarvest }) {
  const { daysElapsed, daysLeft, progress, isReady } = useMemo(() => {
    const planted = new Date(plant.planted_at);
    const now = new Date();
    const elapsed = Math.floor((now - planted) / (1000 * 60 * 60 * 24));
    const left = Math.max(0, plant.days_to_harvest - elapsed);
    const prog = Math.min(100, (elapsed / plant.days_to_harvest) * 100);
    return { daysElapsed: elapsed, daysLeft: left, progress: prog, isReady: left <= 0 };
  }, [plant.planted_at, plant.days_to_harvest]);

  const isHarvested = plant.status === "harvested";
  const IconComponent = ICON_MAP[plant.icon] || Plant;

  // Radial progress
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      data-testid={`plant-card-${plant.id}`}
      className="rounded-3xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md group"
      style={{
        backgroundColor: "var(--ht-bg-surface)",
        borderColor: isReady && !isHarvested ? "var(--ht-harvest)" : "rgba(19,42,27,0.1)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.02)",
        opacity: isHarvested ? 0.6 : 1,
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Radial Progress */}
          <div className="relative w-[76px] h-[76px] flex-shrink-0">
            <svg width="76" height="76" className="-rotate-90">
              <circle cx="38" cy="38" r={radius} fill="none" stroke="var(--ht-bg-secondary)" strokeWidth="5" />
              <circle
                cx="38" cy="38" r={radius} fill="none"
                stroke={isHarvested ? "var(--ht-brand-secondary)" : isReady ? "var(--ht-harvest)" : "var(--ht-brand-primary)"}
                strokeWidth="5" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: "stroke-dashoffset 0.6s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <IconComponent size={24} weight="duotone" style={{ color: "var(--ht-brand-primary)" }} />
            </div>
          </div>
          <div>
            <h4 className="font-medium text-sm" style={{ fontFamily: "Outfit, sans-serif", color: "var(--ht-text-primary)" }}>
              {plant.nickname || plant.name}
            </h4>
            {plant.nickname && plant.nickname !== plant.name && (
              <p className="text-xs" style={{ color: "var(--ht-text-tertiary)" }}>{plant.name}</p>
            )}
            <Badge
              variant="secondary"
              className="mt-1 text-[10px] px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: isHarvested ? "rgba(163,184,158,0.3)" : isReady ? "rgba(255,107,53,0.15)" : "rgba(45,90,60,0.1)",
                color: isHarvested ? "var(--ht-text-tertiary)" : isReady ? "var(--ht-harvest)" : "var(--ht-brand-primary)",
              }}
            >
              {isHarvested ? "Harvested" : isReady ? "Ready!" : plant.category}
            </Badge>
          </div>
        </div>
      </div>

      {/* Timer info */}
      <div className="flex items-center gap-2 mb-3 text-xs" style={{ color: "var(--ht-text-secondary)" }}>
        <Timer size={14} weight="duotone" />
        {isHarvested ? (
          <span>Harvested after {daysElapsed} days</span>
        ) : isReady ? (
          <span className="font-medium" style={{ color: "var(--ht-harvest)" }}>Ready to harvest!</span>
        ) : (
          <span>Day {daysElapsed} of {plant.days_to_harvest} &middot; {daysLeft}d left</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 rounded-full mb-3" style={{ backgroundColor: "var(--ht-bg-secondary)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            backgroundColor: isHarvested ? "var(--ht-brand-secondary)" : isReady ? "var(--ht-harvest)" : "var(--ht-brand-primary)",
          }}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {!isHarvested && isReady && onHarvest && (
          <Button
            data-testid={`harvest-btn-${plant.id}`}
            size="sm"
            onClick={() => onHarvest(plant.id)}
            className="rounded-full text-xs px-3 h-8 transition-all hover:-translate-y-0.5 active:scale-95"
            style={{ backgroundColor: "var(--ht-harvest)", color: "#fff" }}
          >
            <Scissors size={14} weight="bold" className="mr-1" />
            Harvest
          </Button>
        )}
        {onRemove && (
          <Button
            data-testid={`remove-btn-${plant.id}`}
            size="sm"
            variant="ghost"
            onClick={() => onRemove(plant.id)}
            className="rounded-full text-xs px-3 h-8 opacity-0 group-hover:opacity-100 transition-all"
            style={{ color: "var(--ht-error)" }}
          >
            <Trash size={14} weight="duotone" />
          </Button>
        )}
      </div>
    </div>
  );
}
