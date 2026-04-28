import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Plus, Scissors, Trash, Warning, Plant, Drop, Flask, Bell } from "@phosphor-icons/react";

const MAX_SLOTS = 6;

/* ── Simple visual level bar (no numbers) ── */
function LevelIndicator({ level, color, label, icon: Icon }) {
  const segments = 5;
  const filled = Math.round((level / 100) * segments);
  const isLow = level < 30;

  return (
    <div className="flex items-center gap-2">
      <Icon size={18} weight="duotone" style={{ color }} />
      <span className="text-[10px] font-medium w-14" style={{ color: "var(--ht-text-secondary)" }}>{label}</span>
      <div className="flex gap-0.5">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className="w-4 h-2.5 rounded-sm transition-all duration-300"
            style={{
              backgroundColor: i < filled ? color : "var(--ht-bg-secondary)",
              opacity: i < filled ? (isLow ? 1 : 0.8) : 0.4,
            }}
          />
        ))}
      </div>
      {isLow && (
        <Warning size={14} weight="fill" style={{ color: "var(--ht-error)" }} className="animate-pulse" />
      )}
    </div>
  );
}

/* ── Single plant slot ── */
function PlantSlot({ plant, index, onHarvest, onRemove }) {
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
      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border" style={{ borderColor: "rgba(19,42,27,0.08)" }}>
        {plant.image ? (
          <img src={plant.image} alt={plant.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: "var(--ht-bg-secondary)" }}>
            <Plant size={24} weight="duotone" style={{ color: "var(--ht-brand-primary)" }} />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate" style={{ fontFamily: "Outfit, sans-serif", color: "var(--ht-text-primary)" }}>
            {plant.nickname || plant.name}
          </span>
          {isReady && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse" style={{ backgroundColor: "rgba(255,107,53,0.15)", color: "var(--ht-harvest)" }}>
              Ready!
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

/* ── Main Component ── */
export default function SimpleUI({ plants, catalog, tentStatus, notifications, onAddPlant, onRemovePlant, onHarvestPlant, onMarkNotificationRead }) {
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

  // Unread notifications for display
  const unreadNotifs = (notifications || []).filter((n) => !n.read).slice(0, 3);

  // Build slot rows
  const slots = [];
  for (let i = 0; i < MAX_SLOTS; i++) {
    slots.push(growingPlants[i] || null);
  }
  const rows = [slots.slice(0, 2), slots.slice(2, 4), slots.slice(4, 6)];

  const waterLow = tentStatus && tentStatus.water_level < 30;
  const nutrientLow = tentStatus && tentStatus.nutrient_level < 30;

  return (
    <div className="space-y-5" data-testid="simple-ui">

      {/* ── Big Warning Banners ── */}
      <AnimatePresence>
        {waterLow && (
          <motion.div
            key="water-warn"
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl p-5 flex items-center gap-4 border-l-4"
            style={{ backgroundColor: "rgba(74,144,226,0.1)", borderLeftColor: "var(--ht-water)" }}
            data-testid="alert-water"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse" style={{ backgroundColor: "rgba(74,144,226,0.15)" }}>
              <Drop size={26} weight="fill" style={{ color: "var(--ht-water)" }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ fontFamily: "Outfit, sans-serif", color: "var(--ht-text-primary)" }}>Water is running low</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--ht-text-secondary)" }}>Refill the water tank soon</p>
            </div>
          </motion.div>
        )}
        {nutrientLow && (
          <motion.div
            key="nutrient-warn"
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl p-5 flex items-center gap-4 border-l-4"
            style={{ backgroundColor: "rgba(141,107,148,0.1)", borderLeftColor: "var(--ht-nutrition)" }}
            data-testid="alert-nutrient"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse" style={{ backgroundColor: "rgba(141,107,148,0.15)" }}>
              <Flask size={26} weight="fill" style={{ color: "var(--ht-nutrition)" }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ fontFamily: "Outfit, sans-serif", color: "var(--ht-text-primary)" }}>Nutrients running low</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--ht-text-secondary)" }}>Top up the nutrient solution</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Inline Notifications ── */}
      {unreadNotifs.length > 0 && (
        <div className="space-y-2" data-testid="inline-notifications">
          {unreadNotifs.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer transition-all hover:shadow-sm"
              style={{
                backgroundColor: "var(--ht-bg-surface)",
                borderLeft: `3px solid ${
                  n.type === "harvest_ready" ? "var(--ht-harvest)" :
                  n.type === "low_water" ? "var(--ht-water)" :
                  n.type === "low_nutrients" ? "var(--ht-nutrition)" : "var(--ht-brand-primary)"
                }`,
              }}
              onClick={() => onMarkNotificationRead && onMarkNotificationRead(n.id)}
              data-testid={`inline-notif-${n.id}`}
            >
              <Bell size={14} weight="fill" style={{ color: "var(--ht-brand-primary)" }} />
              <span className="text-xs flex-1" style={{ color: "var(--ht-text-primary)" }}>{n.message}</span>
              <span className="text-[10px]" style={{ color: "var(--ht-text-tertiary)" }}>tap to dismiss</span>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Level Indicators + Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-medium" style={{ fontFamily: "Outfit, sans-serif", color: "var(--ht-text-primary)" }}>
            Your Tent
          </h2>
          <p className="text-xs mt-0.5 mb-3" style={{ color: "var(--ht-text-tertiary)" }}>
            {growingPlants.length} of {MAX_SLOTS} slots used
          </p>
          {tentStatus && (
            <div className="space-y-1.5">
              <LevelIndicator level={tentStatus.water_level} color="var(--ht-water)" label="Water" icon={Drop} />
              <LevelIndicator level={tentStatus.nutrient_level} color="var(--ht-nutrition)" label="Nutrients" icon={Flask} />
            </div>
          )}
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
                <DialogDescription className="sr-only">Choose a plant from the catalog</DialogDescription>
              </DialogHeader>
              <div className="px-6 pb-6 space-y-4">
                <p className="text-xs" style={{ color: "var(--ht-text-tertiary)" }}>
                  {slotsAvailable} slot{slotsAvailable !== 1 ? "s" : ""} remaining — you can add multiples of the same plant
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {catalog.map((p) => (
                    <button
                      key={p.id}
                      data-testid={`catalog-plant-${p.id}`}
                      onClick={() => setSelectedPlant(p.id)}
                      className="rounded-xl border p-3 flex items-center gap-3 text-left transition-all hover:-translate-y-0.5"
                      style={{
                        borderColor: selectedPlant === p.id ? "var(--ht-brand-primary)" : "rgba(19,42,27,0.1)",
                        backgroundColor: selectedPlant === p.id ? "rgba(45,90,60,0.06)" : "transparent",
                      }}
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border" style={{ borderColor: "rgba(19,42,27,0.06)" }}>
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-xs font-medium" style={{ color: "var(--ht-text-primary)" }}>{p.name}</p>
                        <p className="text-[10px]" style={{ color: "var(--ht-text-tertiary)" }}>{p.days_to_harvest} days</p>
                      </div>
                    </button>
                  ))}
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

      {/* ── Plant Rows ── */}
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
              />
            ))}
          </div>
        ))}
      </div>

      {/* ── Harvested chips ── */}
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
                  {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <Plant size={12} weight="duotone" />}
                </div>
                <span className="text-xs" style={{ color: "var(--ht-text-tertiary)" }}>{p.nickname || p.name}</span>
                <button onClick={() => onRemovePlant(p.id)} className="opacity-50 hover:opacity-100" style={{ color: "var(--ht-error)" }} data-testid={`remove-harvested-${p.id}`}>
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
