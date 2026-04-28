import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { Plant, Trophy, Clock } from "@phosphor-icons/react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function CommunityFeed() {
  const [feed, setFeed] = useState([]);

  const fetchFeed = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/community/feed`);
      setFeed(res.data);
    } catch {
      toast.error("Failed to load community feed");
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6" data-testid="community-feed">
      {/* Header */}
      <div
        className="rounded-3xl border p-6 sm:p-8"
        style={{
          backgroundColor: "var(--ht-bg-surface)",
          borderColor: "rgba(19,42,27,0.1)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.02)",
          backgroundImage: `url(https://images.unsplash.com/photo-1565958047335-931d1b30ea8f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MTJ8MHwxfHNlYXJjaHwyfHxoeWRyb3BvbmljJTIwZmFybSUyMGluZG9vciUyMHBsYW50c3xlbnwwfHx8fDE3NzczNjYyNTl8MA&ixlib=rb-4.1.0&q=85)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
        }}
      >
        <div className="absolute inset-0 rounded-3xl" style={{ backgroundColor: "rgba(45,90,60,0.85)" }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Trophy size={24} weight="duotone" style={{ color: "var(--ht-brand-accent)" }} />
            <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-white" style={{ fontFamily: "Outfit, sans-serif" }}>
              Harvest Feed
            </h2>
          </div>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
            See what the community has been growing and harvesting.
          </p>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Plant size={16} weight="duotone" style={{ color: "var(--ht-brand-accent)" }} />
              <span className="text-sm font-medium text-white">{feed.length} harvest{feed.length !== 1 ? "s" : ""} logged</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feed items */}
      {feed.length === 0 ? (
        <div className="text-center py-16">
          <Plant size={48} weight="duotone" style={{ color: "var(--ht-brand-secondary)" }} className="mx-auto mb-3" />
          <p className="text-sm" style={{ color: "var(--ht-text-tertiary)" }}>
            No harvests yet. Grow some plants and harvest them!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {feed.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border p-4 flex items-center gap-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
              style={{
                backgroundColor: "var(--ht-bg-surface)",
                borderColor: "rgba(19,42,27,0.1)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.02)",
              }}
              data-testid={`feed-item-${item.id}`}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "rgba(255,107,53,0.12)" }}
              >
                <Plant size={20} weight="duotone" style={{ color: "var(--ht-harvest)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ fontFamily: "Outfit, sans-serif", color: "var(--ht-text-primary)" }}>
                  {item.nickname || item.plant_name} harvested!
                </p>
                {item.notes && (
                  <p className="text-xs truncate" style={{ color: "var(--ht-text-tertiary)" }}>{item.notes}</p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Clock size={12} weight="duotone" style={{ color: "var(--ht-text-tertiary)" }} />
                <span className="text-xs" style={{ color: "var(--ht-text-tertiary)" }}>{timeAgo(item.harvested_at)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
