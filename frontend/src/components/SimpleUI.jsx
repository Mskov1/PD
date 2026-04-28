import { useState } from "react";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Leaf, Drop, Flask } from "@phosphor-icons/react";
import PlantCard from "@/components/PlantCard";
import WaterTube from "@/components/WaterTube";

export default function SimpleUI({ plants, catalog, tentStatus, onAddPlant, onRemovePlant, onHarvestPlant }) {
  const [selectedPlant, setSelectedPlant] = useState("");
  const [nickname, setNickname] = useState("");

  const handleAdd = () => {
    if (!selectedPlant) return;
    onAddPlant(selectedPlant, nickname || undefined);
    setSelectedPlant("");
    setNickname("");
  };

  const growingPlants = plants.filter((p) => p.status === "growing");
  const harvestedPlants = plants.filter((p) => p.status === "harvested");

  return (
    <div className="space-y-8">
      {/* Add Plant Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border p-6 sm:p-8"
        style={{
          backgroundColor: "var(--ht-bg-surface)",
          borderColor: "rgba(19,42,27,0.1)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.02)",
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Leaf size={20} weight="duotone" style={{ color: "var(--ht-brand-primary)" }} />
          <h2 className="text-xl font-medium" style={{ fontFamily: "Outfit, sans-serif", color: "var(--ht-text-primary)" }}>
            Add a Plant
          </h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedPlant} onValueChange={setSelectedPlant}>
            <SelectTrigger
              data-testid="plant-select-trigger"
              className="flex-1 rounded-full h-11 px-4"
              style={{ borderColor: "rgba(19,42,27,0.15)" }}
            >
              <SelectValue placeholder="Choose a plant..." />
            </SelectTrigger>
            <SelectContent data-testid="plant-select-content">
              {catalog.map((plant) => (
                <SelectItem key={plant.id} value={plant.id} data-testid={`plant-option-${plant.id}`}>
                  <span className="flex items-center gap-2">
                    <span>{plant.name}</span>
                    <span className="text-xs" style={{ color: "var(--ht-text-tertiary)" }}>
                      {plant.days_to_harvest}d
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            data-testid="plant-nickname-input"
            placeholder="Nickname (optional)"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="sm:w-48 rounded-full h-11 px-4"
            style={{ borderColor: "rgba(19,42,27,0.15)" }}
          />
          <Button
            data-testid="add-plant-btn"
            onClick={handleAdd}
            disabled={!selectedPlant}
            className="rounded-full h-11 px-6 font-medium transition-all hover:-translate-y-0.5 active:scale-95"
            style={{
              backgroundColor: "var(--ht-brand-primary)",
              color: "#fff",
            }}
          >
            <Plus size={18} weight="bold" className="mr-1" />
            Add Plant
          </Button>
        </div>
      </motion.div>

      {/* Quick Status Indicators */}
      {tentStatus && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          <div
            className="rounded-2xl border p-4 flex items-center gap-3"
            style={{ backgroundColor: "var(--ht-bg-surface)", borderColor: "rgba(19,42,27,0.1)" }}
          >
            <WaterTube level={tentStatus.water_level} color="var(--ht-water)" size="sm" />
            <div>
              <p className="text-xs tracking-wider uppercase font-bold" style={{ color: "var(--ht-text-tertiary)" }}>Water</p>
              <p className="text-lg font-medium font-mono" style={{ color: "var(--ht-water)" }}>{Math.round(tentStatus.water_level)}%</p>
            </div>
          </div>
          <div
            className="rounded-2xl border p-4 flex items-center gap-3"
            style={{ backgroundColor: "var(--ht-bg-surface)", borderColor: "rgba(19,42,27,0.1)" }}
          >
            <WaterTube level={tentStatus.nutrient_level} color="var(--ht-nutrition)" size="sm" />
            <div>
              <p className="text-xs tracking-wider uppercase font-bold" style={{ color: "var(--ht-text-tertiary)" }}>Nutrients</p>
              <p className="text-lg font-medium font-mono" style={{ color: "var(--ht-nutrition)" }}>{Math.round(tentStatus.nutrient_level)}%</p>
            </div>
          </div>
          <div
            className="rounded-2xl border p-4 flex items-center gap-3"
            style={{ backgroundColor: "var(--ht-bg-surface)", borderColor: "rgba(19,42,27,0.1)" }}
          >
            <Drop size={28} weight="duotone" style={{ color: "var(--ht-water)" }} />
            <div>
              <p className="text-xs tracking-wider uppercase font-bold" style={{ color: "var(--ht-text-tertiary)" }}>pH</p>
              <p className="text-lg font-medium font-mono" style={{ color: "var(--ht-text-primary)" }}>{tentStatus.ph_level}</p>
            </div>
          </div>
          <div
            className="rounded-2xl border p-4 flex items-center gap-3"
            style={{ backgroundColor: "var(--ht-bg-surface)", borderColor: "rgba(19,42,27,0.1)" }}
          >
            <Flask size={28} weight="duotone" style={{ color: "var(--ht-brand-primary)" }} />
            <div>
              <p className="text-xs tracking-wider uppercase font-bold" style={{ color: "var(--ht-text-tertiary)" }}>Temp</p>
              <p className="text-lg font-medium font-mono" style={{ color: "var(--ht-text-primary)" }}>{tentStatus.temperature}°C</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Growing Plants */}
      {growingPlants.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4" style={{ fontFamily: "Outfit, sans-serif", color: "var(--ht-text-primary)" }}>
            Growing ({growingPlants.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {growingPlants.map((plant, i) => (
              <motion.div
                key={plant.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <PlantCard
                  plant={plant}
                  onRemove={onRemovePlant}
                  onHarvest={onHarvestPlant}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Harvested */}
      {harvestedPlants.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4" style={{ fontFamily: "Outfit, sans-serif", color: "var(--ht-text-secondary)" }}>
            Harvested ({harvestedPlants.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {harvestedPlants.map((plant, i) => (
              <motion.div
                key={plant.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <PlantCard plant={plant} onRemove={onRemovePlant} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {plants.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <Leaf size={64} weight="duotone" style={{ color: "var(--ht-brand-secondary)" }} className="mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2" style={{ fontFamily: "Outfit, sans-serif", color: "var(--ht-text-primary)" }}>
            Your tent is empty
          </h3>
          <p style={{ color: "var(--ht-text-secondary)" }}>
            Add your first plant using the dropdown above to get started.
          </p>
        </motion.div>
      )}
    </div>
  );
}
