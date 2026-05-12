import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Plus, Scissors, Trash, Warning, Plant, Drop, Flask, Bell, ChatCircleDots, X } from "@phosphor-icons/react";

const FADE_IN = { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 } };
const SCALE_IN = { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 } };
const SLIDE_IN = { initial: { opacity: 0, x: -12 }, animate: { opacity: 1, x: 0 } };
const TANK_FILL = { duration: 0.8, ease: "easeOut" };

const NOTIF_BORDER_COLORS = {
  harvest_ready: "var(--ht-harvest)",
  low_water: "var(--ht-water)",
  low_nutrients: "var(--ht-nutrition)",
};

function getNotifBorderColor(type) {
  return NOTIF_BORDER_COLORS[type] || "var(--ht-brand-primary)";
}

/* ── Visual water/nutrient tank indicator ── */
function TankIndicator({ level, color, label, icon: Icon }) {
  const isLow = level < 30;
  const fillPercent = Math.max(5, Math.min(100, level));

  return (
    <div
      className="rounded-2xl border p-4 flex flex-col items-center gap-2 transition-all"
      style={{
        backgroundColor: "var(--ht-bg-surface)",
        borderColor: isLow ? color : "rgba(19,42,27,0.1)",
        boxShadow: isLow ? `0 0 16px ${color}20` : "0 2px 12px rgba(0,0,0,0.02)",
      }}
      data-testid={`tank-${label.toLowerCase()}`}
    >
      <Icon size={20} weight="duotone" style={{ color }} />
      <div className="w-10 h-20 rounded-full border-2 overflow-hidden relative" style={{ borderColor: `${color}50` }}>
        <motion.div
          className="absolute bottom-0 left-0 right-0 rounded-b-full"
          initial={{ height: 0 }}
          animate={{ height: `${fillPercent}%` }}
          transition={TANK_FILL}
          style={{ backgroundColor: color, opacity: 0.6 }}
        />
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: `${fillPercent}%`,
            background: `linear-gradient(to right, transparent 15%, rgba(255,255,255,0.35) 50%, transparent 85%)`,
          }}
        />
      </div>
      <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: "var(--ht-text-tertiary)" }}>
        {label}
      </span>
      {isLow && (
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full animate-pulse" style={{ backgroundColor: `${color}18`, color }}>
          LOW
        </span>
      )}
    </div>
  );
}

/* ── Plant card (prototype-inspired with big image) ── */
function PlantCard({ plant, onHarvest, onRemove }) {
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

  // Radial progress
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - ((lifecycle?.progress || 0) / 100) * circumference;

  function getRingColor() {
    if (isReady) return "var(--ht-harvest)";
    return "var(--ht-brand-primary)";
  }

  function getDaysLabel() {
    if (isReady) return "!";
    return `${lifecycle?.left}d`;
  }

  return (
    <motion.div
      layout
      {...SCALE_IN}
      data-testid={`plant-card-${plant.id}`}
      className="rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group"
      style={{
        backgroundColor: "var(--ht-bg-surface)",
        borderColor: isReady ? "var(--ht-harvest)" : "rgba(19,42,27,0.1)",
        boxShadow: isReady ? "0 0 0 1px rgba(255,107,53,0.2), 0 4px 16px rgba(255,107,53,0.08)" : "0 2px 12px rgba(0,0,0,0.02)",
        opacity: isHarvested ? 0.5 : 1,
      }}
    >
      {/* Image */}
      <div className="relative h-32 overflow-hidden" style={{ backgroundColor: "var(--ht-bg-secondary)" }}>
        {plant.image ? (
          <img src={plant.image} alt={plant.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Plant size={40} weight="duotone" style={{ color: "var(--ht-brand-secondary)" }} />
          </div>
        )}
        {/* Remove button */}
        <button
          data-testid={`remove-btn-${plant.id}`}
          onClick={() => onRemove(plant.id)}
          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ backgroundColor: "rgba(211,63,73,0.9)", color: "#fff" }}
        >
          <X size={12} weight="bold" />
        </button>
        {/* Progress ring */}
        {!isHarvested && (
          <div className="absolute bottom-2 right-2 w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.9)", backdropFilter: "blur(4px)" }}>
            <svg width="56" height="56" className="-rotate-90">
              <circle cx="28" cy="28" r={radius} fill="none" stroke="rgba(19,42,27,0.1)" strokeWidth="3" />
              <circle
                cx="28" cy="28" r={radius} fill="none"
                stroke={getRingColor()}
                strokeWidth="3" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                style={{ transition: "stroke-dashoffset 0.6s ease" }}
              />
            </svg>
            <span className="absolute text-[10px] font-bold" style={{ color: getRingColor() }}>
              {getDaysLabel()}
            </span>
          </div>
        )}
      </div>
      {/* Info */}
      <div className="p-3">
        <h4 className="text-sm font-medium truncate" style={{ fontFamily: "Outfit, sans-serif", color: "var(--ht-text-primary)" }}>
          {plant.nickname || plant.name}
        </h4>
        {isReady && onHarvest && (
          <Button
            data-testid={`harvest-btn-${plant.id}`}
            size="sm"
            onClick={() => onHarvest(plant.id)}
            className="w-full mt-2 rounded-xl text-xs h-8 transition-all active:scale-95"
            style={{ backgroundColor: "var(--ht-harvest)", color: "#fff" }}
          >
            <Scissors size={14} weight="bold" className="mr-1" /> Harvest
          </Button>
        )}
        {isHarvested && (
          <span className="text-[10px] mt-1 block" style={{ color: "var(--ht-text-tertiary)" }}>Harvested</span>
        )}
      </div>
    </motion.div>
  );
}

/* ── Main Component ── */
export default function SimpleUI({ plants, catalog, tentStatus, notifications, onAddPlant, onRemovePlant, onHarvestPlant, onMarkNotificationRead, onOpenAI }) {
  const [selectedPlant, setSelectedPlant] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);

  const growingPlants = plants.filter((p) => p.status === "growing");
  const harvestedPlants = plants.filter((p) => p.status === "harvested");

  const handleAdd = () => {
    if (!selectedPlant) return;
    onAddPlant(selectedPlant);
    setSelectedPlant("");
    setShowAddDialog(false);
  };

  const unreadNotifs = (notifications || []).filter((n) => !n.read).slice(0, 3);
  const waterLow = tentStatus && tentStatus.water_level < 30;
  const nutrientLow = tentStatus && tentStatus.nutrient_level < 30;

  return (
    <div className="space-y-6" data-testid="simple-ui">

      {/* Big Warning Banners */}
      <AnimatePresence>
        {waterLow && (
          <motion.div key="water-warn" {...FADE_IN}
            className="rounded-2xl p-5 flex items-center gap-4 border-l-4"
            style={{ backgroundColor: "rgba(74,144,226,0.1)", borderLeftColor: "var(--ht-water)" }} data-testid="alert-water">
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
          <motion.div key="nutrient-warn" {...FADE_IN}
            className="rounded-2xl p-5 flex items-center gap-4 border-l-4"
            style={{ backgroundColor: "rgba(141,107,148,0.1)", borderLeftColor: "var(--ht-nutrition)" }} data-testid="alert-nutrient">
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

      {/* Inline Notifications */}
      {unreadNotifs.length > 0 && (
        <div className="space-y-2" data-testid="inline-notifications">
          {unreadNotifs.map((n) => (
            <motion.div key={n.id} {...SLIDE_IN}
              className="flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer transition-all hover:shadow-sm"
              style={{ backgroundColor: "var(--ht-bg-surface)", borderLeft: `3px solid ${getNotifBorderColor(n.type)}` }}
              onClick={() => onMarkNotificationRead?.(n.id)} data-testid={`inline-notif-${n.id}`}>
              <Bell size={14} weight="fill" style={{ color: "var(--ht-brand-primary)" }} />
              <span className="text-xs flex-1" style={{ color: "var(--ht-text-primary)" }}>{n.message}</span>
              <span className="text-[10px]" style={{ color: "var(--ht-text-tertiary)" }}>tap to dismiss</span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Tank levels + AI Button row */}
      <div className="flex items-start gap-4 flex-wrap">
        {tentStatus && (
          <div className="flex gap-3">
            <TankIndicator level={tentStatus.water_level} color="var(--ht-water)" label="Water" icon={Drop} />
            <TankIndicator level={tentStatus.nutrient_level} color="var(--ht-nutrition)" label="Nutrients" icon={Flask} />
          </div>
        )}
        {/* AI Help Button - prominent */}
        <button
          data-testid="ai-help-btn"
          onClick={onOpenAI}
          className="rounded-2xl border p-4 flex flex-col items-center gap-2 transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer"
          style={{ backgroundColor: "var(--ht-brand-accent)", borderColor: "rgba(212,255,30,0.5)", minWidth: 100, boxShadow: "0 4px 20px rgba(212,255,30,0.2)" }}
        >
          <ChatCircleDots size={28} weight="duotone" style={{ color: "var(--ht-text-primary)" }} />
          <span className="text-xs font-bold" style={{ color: "var(--ht-text-primary)" }}>Ask AI</span>
          <span className="text-[9px]" style={{ color: "var(--ht-text-secondary)" }}>Get help</span>
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium" style={{ fontFamily: "Outfit, sans-serif", color: "var(--ht-text-primary)" }}>
          Your Plants
        </h2>
        <span className="text-xs" style={{ color: "var(--ht-text-tertiary)" }}>{growingPlants.length} growing</span>
      </div>

      {/* Plants Grid - dynamic, no fixed slots */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {/* Add plant card */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <button
              data-testid="open-add-plant-dialog"
              className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 min-h-[200px] transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer"
              style={{ borderColor: "rgba(45,90,60,0.2)", backgroundColor: "rgba(45,90,60,0.02)" }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(45,90,60,0.08)" }}>
                <Plus size={20} weight="bold" style={{ color: "var(--ht-brand-primary)" }} />
              </div>
              <span className="text-xs font-medium" style={{ color: "var(--ht-brand-primary)" }}>Add Plant</span>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden" style={{ backgroundColor: "var(--ht-bg-surface)" }}>
            <DialogHeader className="p-6 pb-2">
              <DialogTitle style={{ fontFamily: "Outfit, sans-serif" }}>Add a Plant</DialogTitle>
              <DialogDescription className="sr-only">Choose a plant from the catalog</DialogDescription>
            </DialogHeader>
            <div className="px-6 pb-6 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {catalog.map((p) => (
                  <button key={p.id} data-testid={`catalog-plant-${p.id}`} onClick={() => setSelectedPlant(p.id)}
                    className="rounded-xl border p-3 flex items-center gap-3 text-left transition-all hover:-translate-y-0.5"
                    style={{ borderColor: selectedPlant === p.id ? "var(--ht-brand-primary)" : "rgba(19,42,27,0.1)", backgroundColor: selectedPlant === p.id ? "rgba(45,90,60,0.06)" : "transparent" }}>
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
                <DialogClose asChild><Button variant="ghost" className="flex-1 rounded-xl h-10">Cancel</Button></DialogClose>
                <Button data-testid="confirm-add-plant" disabled={!selectedPlant} onClick={handleAdd}
                  className="flex-1 rounded-xl h-10 transition-all active:scale-95" style={{ backgroundColor: "var(--ht-brand-primary)", color: "#fff" }}>
                  Add to Tent
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Plant cards */}
        {growingPlants.map((plant) => (
          <PlantCard key={plant.id} plant={plant} onHarvest={onHarvestPlant} onRemove={onRemovePlant} />
        ))}
      </div>

      {/* Harvested */}
      {harvestedPlants.length > 0 && (
        <div className="pt-4 border-t" style={{ borderColor: "rgba(19,42,27,0.06)" }}>
          <p className="text-xs font-bold tracking-wider uppercase mb-3" style={{ color: "var(--ht-text-tertiary)" }}>Recently Harvested</p>
          <div className="flex flex-wrap gap-2">
            {harvestedPlants.map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded-full border px-3 py-1.5"
                style={{ borderColor: "rgba(19,42,27,0.08)", backgroundColor: "rgba(244,245,240,0.5)" }} data-testid={`harvested-chip-${p.id}`}>
                <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                  {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <Plant size={12} weight="duotone" />}
                </div>
                <span className="text-xs" style={{ color: "var(--ht-text-tertiary)" }}>{p.nickname || p.name}</span>
                <button onClick={() => onRemovePlant(p.id)} className="opacity-50 hover:opacity-100" style={{ color: "var(--ht-error)" }}><Trash size={10} /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
