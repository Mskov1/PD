import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Plus, Drop, Flask, Scissors, Trash, Warning, Plant, Timer } from "@phosphor-icons/react";

const MAX_SLOTS = 6;

function PlantSlot({ plant, index, onHarvest, onRemove, catalog }) {
  const lifecycle = useMemo(() => {
    if (!plant) return null;
    const planted = new Date(plant.planted_at);
    const now = new Date();
    const elapsed = Math.floor((now - planted) / (1000 * 60 * 60 * 24));
    const left = Math.max(0, plant.days_to_harvest - elapsed);
    const progress = Math.min(100, (elapsed / plant.days_to_harvest) * 100);
    return { elapsed, left, progress, isReady: left <= 0 };
  }, [plant]);

  const isHarvested = plant?.status === "harvested";
  const isReady = lifecycle?.isReady && !isHarvested;

  if (!plant) {
    return (
      <div
        data-testid={`slot-empty-${index}`}
        className="rounded-2xl border-2 border-dashed p-4 flex items-center justify-center min-h-[88px] transition-colors"
        style={{ borderColor: "rgba(19,42,27,0.1)", backgroundColor: "rgba(244,245,240,0.5)" }}
      >
        <span className="text-xs" style={{ color: "var(--ht-text-tertiary)" }}>Empty slot</span>
      </div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      data-testid={`plant-slot-${plant.id}`}
      className="rounded-2xl border p-4 flex items-center gap-4 transition-all duration-300 hover:shadow-md group"
      style={{
        backgroundColor: "var(--ht-bg-surface)",
        borderColor: isReady ? "var(--ht-harvest)" : "rgba(19,42,27,0.1)",
        boxShadow: isReady ? "0 0 0 1px rgba(255,107,53,0.2), 0 4px 16px rgba(255,107,53,0.08)" : "0 2px 12px rgba(0,0,0,0.02)",
        opacity: isHarvested ? 0.5 : 1,
      }}
    >
      {/* Plant image */}
      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border" style={{ borderColor: "rgba(19,42,27,0.08)" }}>
        {plant.image ? (
          <img src={plant.image} alt={plant.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: "var(--ht-bg-secondary)" }}>
            <Plant size={24} weight="duotone" style={{ color: "var(--ht-brand-primary)" }} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate" style={{ fontFamily: "Outfit, sans-serif", color: "var(--ht-text-primary)" }}>
            {plant.nickname || plant.name}
          </span>
          {isReady && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(255,107,53,0.12)", color: "var(--ht-harvest)" }}>
              Ready
            </span>
          )}
          {isHarvested && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(163,184,158,0.3)", color: "var(--ht-text-tertiary)" }}>
              Done
            </span>
          )}
        </div>
        {!isHarvested && lifecycle && (
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: "var(--ht-bg-secondary)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${lifecycle.progress}%`,
                  backgroundColor: isReady ? "var(--ht-harvest)" : "var(--ht-brand-primary)",
                }}
              />
            </div>
            <span className="text-[10px] flex-shrink-0" style={{ color: "var(--ht-text-tertiary)" }}>
              {isReady ? "Harvest!" : `${lifecycle.left}d`}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {isReady && onHarvest && (
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
        <Button
          data-testid={`remove-btn-${plant.id}`}
          size="sm"
          variant="ghost"
          onClick={() => onRemove(plant.id)}
          className="rounded-full w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-all"
          style={{ color: "var(--ht-error)" }}
        >
          <Trash size={14} weight="duotone" />
        </Button>
      </div>
    </motion.div>
  );
}

export default function SimpleUI({ plants, catalog, tentStatus, onAddPlant, onRemovePlant, onHarvestPlant }) {
  const [selectedPlant, setSelectedPlant] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);

  const growingPlants = plants.filter((p) => p.status === "growing");
  const slotsAvailable = MAX_SLOTS - growingPlants.length;

  const handleAdd = () => {
    if (!selectedPlant) return;
    onAddPlant(selectedPlant);
    setSelectedPlant("");
    setShowAddDialog(false);
  };

  // Critical alerts - only show when action is needed
  const alerts = [];
  if (tentStatus) {
    if (tentStatus.water_level < 30) {
      alerts.push({ key: "water", icon: Drop, message: "Water level is low — refill needed", color: "var(--ht-water)", bg: "rgba(74,144,226,0.08)" });
    }
    if (tentStatus.nutrient_level < 30) {
      alerts.push({ key: "nutrient", icon: Flask, message: "Nutrients running low — top up", color: "var(--ht-nutrition)", bg: "rgba(141,107,148,0.08)" });
    }
  }

  const readyPlants = growingPlants.filter((p) => {
    const elapsed = Math.floor((Date.now() - new Date(p.planted_at).getTime()) / (1000 * 60 * 60 * 24));
    return p.days_to_harvest - elapsed <= 0;
  });

  if (readyPlants.length > 0) {
    alerts.push({ key: "harvest", icon: Scissors, message: `${readyPlants.length} plant${readyPlants.length > 1 ? "s" : ""} ready to harvest`, color: "var(--ht-harvest)", bg: "rgba(255,107,53,0.08)" });
  }

  // Build slot rows: 3 rows of 2
  const slots = [];
  for (let i = 0; i < MAX_SLOTS; i++) {
    slots.push(growingPlants[i] || null);
  }
  const rows = [slots.slice(0, 2), slots.slice(2, 4), slots.slice(4, 6)];

  return (
    <div className="space-y-6" data-testid="simple-ui">
      {/* Action Alerts */}
      <AnimatePresence>
        {alerts.map((alert) => (
          <motion.div
            key={alert.key}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 rounded-2xl p-4 border-l-4"
            style={{ backgroundColor: alert.bg, borderLeftColor: alert.color }}
            data-testid={`alert-${alert.key}`}
          >
            <alert.icon size={20} weight="duotone" style={{ color: alert.color }} />
            <span className="text-sm font-medium flex-1" style={{ color: "var(--ht-text-primary)" }}>{alert.message}</span>
            <Warning size={16} weight="fill" style={{ color: alert.color, opacity: 0.6 }} />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Tent Grid Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium" style={{ fontFamily: "Outfit, sans-serif", color: "var(--ht-text-primary)" }}>
            Your Tent
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--ht-text-tertiary)" }}>
            {growingPlants.length} of {MAX_SLOTS} slots used
          </p>
        </div>
        {slotsAvailable > 0 && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button
                data-testid="open-add-plant-dialog"
                className="rounded-full h-10 px-5 font-medium transition-all hover:-translate-y-0.5 active:scale-95"
                style={{ backgroundColor: "var(--ht-brand-primary)", color: "#fff" }}
              >
                <Plus size={16} weight="bold" className="mr-1.5" />
                Add Plant
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden" style={{ backgroundColor: "var(--ht-bg-surface)" }}>
              <DialogHeader className="p-6 pb-2">
                <DialogTitle style={{ fontFamily: "Outfit, sans-serif", color: "var(--ht-text-primary)" }}>
                  Add a Plant to Your Tent
                </DialogTitle>
              </DialogHeader>
              <div className="px-6 pb-6 space-y-4">
                <p className="text-xs" style={{ color: "var(--ht-text-tertiary)" }}>
                  {slotsAvailable} slot{slotsAvailable !== 1 ? "s" : ""} remaining
                </p>
                {/* Plant options as visual cards */}
                <div className="grid grid-cols-2 gap-2">
                  {catalog.map((p) => {
                    const alreadyPlanted = growingPlants.some((gp) => gp.catalog_id === p.id);
                    return (
                      <button
                        key={p.id}
                        data-testid={`catalog-plant-${p.id}`}
                        onClick={() => setSelectedPlant(p.id)}
                        className="rounded-xl border p-3 flex items-center gap-3 text-left transition-all hover:-translate-y-0.5"
                        style={{
                          borderColor: selectedPlant === p.id ? "var(--ht-brand-primary)" : "rgba(19,42,27,0.1)",
                          backgroundColor: selectedPlant === p.id ? "rgba(45,90,60,0.06)" : "transparent",
                          opacity: alreadyPlanted ? 0.4 : 1,
                        }}
                        disabled={alreadyPlanted}
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border" style={{ borderColor: "rgba(19,42,27,0.06)" }}>
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-xs font-medium" style={{ color: "var(--ht-text-primary)" }}>{p.name}</p>
                          <p className="text-[10px]" style={{ color: "var(--ht-text-tertiary)" }}>{p.days_to_harvest} days</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <DialogClose asChild>
                    <Button variant="ghost" className="flex-1 rounded-xl h-10">Cancel</Button>
                  </DialogClose>
                  <Button
                    data-testid="confirm-add-plant"
                    disabled={!selectedPlant}
                    onClick={handleAdd}
                    className="flex-1 rounded-xl h-10 transition-all active:scale-95"
                    style={{ backgroundColor: "var(--ht-brand-primary)", color: "#fff" }}
                  >
                    Add to Tent
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Plant Rows - 3 rows x 2 columns */}
      <div className="space-y-3">
        {rows.map((row, ri) => (
          <div key={ri} className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid={`tent-row-${ri}`}>
            {row.map((plant, ci) => (
              <PlantSlot
                key={plant?.id || `empty-${ri}-${ci}`}
                plant={plant}
                index={ri * 2 + ci}
                onHarvest={onHarvestPlant}
                onRemove={onRemovePlant}
                catalog={catalog}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Harvested plants - collapsed section */}
      {plants.filter((p) => p.status === "harvested").length > 0 && (
        <div className="pt-4 border-t" style={{ borderColor: "rgba(19,42,27,0.06)" }}>
          <p className="text-xs font-bold tracking-wider uppercase mb-3" style={{ color: "var(--ht-text-tertiary)" }}>
            Recently Harvested
          </p>
          <div className="flex flex-wrap gap-2">
            {plants.filter((p) => p.status === "harvested").map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 rounded-full border px-3 py-1.5"
                style={{ borderColor: "rgba(19,42,27,0.08)", backgroundColor: "rgba(244,245,240,0.5)" }}
                data-testid={`harvested-chip-${p.id}`}
              >
                <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <Plant size={12} weight="duotone" style={{ color: "var(--ht-brand-secondary)" }} />
                  )}
                </div>
                <span className="text-xs" style={{ color: "var(--ht-text-tertiary)" }}>{p.nickname || p.name}</span>
                <button
                  onClick={() => onRemovePlant(p.id)}
                  className="text-xs transition-opacity hover:opacity-100 opacity-50"
                  style={{ color: "var(--ht-error)" }}
                  data-testid={`remove-harvested-${p.id}`}
                >
                  <Trash size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
