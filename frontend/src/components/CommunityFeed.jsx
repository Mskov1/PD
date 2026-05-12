import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plant, Trophy, Clock, Camera, ImageSquare } from "@phosphor-icons/react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function MediaDisplay({ item }) {
  const [blobUrl, setBlobUrl] = useState(null);

  useEffect(() => {
    if (!item.media_path) return;
    let cancelled = false;
    axios.get(`${API}/community/media/${item.media_path}`, { responseType: "blob" })
      .then((res) => {
        if (!cancelled) setBlobUrl(URL.createObjectURL(res.data));
      })
      .catch(() => {});
    return () => { cancelled = true; if (blobUrl) URL.revokeObjectURL(blobUrl); };
  }, [item.media_path]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!blobUrl) return null;

  const isVideo = item.media_type?.startsWith("video/");
  return isVideo ? (
    <video src={blobUrl} controls className="w-full rounded-xl max-h-60 object-cover" />
  ) : (
    <img src={blobUrl} alt="Community post" className="w-full rounded-xl max-h-60 object-cover" />
  );
}

export default function CommunityFeed() {
  const [feed, setFeed] = useState([]);
  const [uploading, setUploading] = useState(false);

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

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("caption", "");
    setUploading(true);
    try {
      await axios.post(`${API}/community/post`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Posted to community!");
      fetchFeed();
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

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
          backgroundColor: "var(--ht-bg-surface)", borderColor: "rgba(19,42,27,0.1)", boxShadow: "0 4px 24px rgba(0,0,0,0.02)",
          backgroundImage: `url(https://images.unsplash.com/photo-1565958047335-931d1b30ea8f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MTJ8MHwxfHNlYXJjaHwyfHxoeWRyb3BvbmljJTIwZmFybSUyMGluZG9vciUyMHBsYW50c3xlbnwwfHx8fDE3NzczNjYyNTl8MA&ixlib=rb-4.1.0&q=85)`,
          backgroundSize: "cover", backgroundPosition: "center", position: "relative",
        }}
      >
        <div className="absolute inset-0 rounded-3xl" style={{ backgroundColor: "rgba(45,90,60,0.85)" }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Trophy size={24} weight="duotone" style={{ color: "var(--ht-brand-accent)" }} />
            <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-white" style={{ fontFamily: "Outfit, sans-serif" }}>
              Community
            </h2>
          </div>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
            Share your harvests, photos, and videos with the community.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <Plant size={16} weight="duotone" style={{ color: "var(--ht-brand-accent)" }} />
            <span className="text-sm font-medium text-white">{feed.length} post{feed.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      {/* Upload */}
      <div className="flex gap-3">
        <label className="flex-1">
          <input type="file" accept="image/*,video/*" className="hidden" onChange={handleUpload} data-testid="community-upload-input" />
          <Button
            data-testid="community-upload-btn"
            variant="outline"
            className="w-full rounded-xl h-11 cursor-pointer transition-all hover:-translate-y-0.5"
            style={{ borderColor: "rgba(19,42,27,0.15)" }}
            disabled={uploading}
            asChild
          >
            <span>
              <Camera size={16} weight="duotone" className="mr-2" />
              {uploading ? "Uploading..." : "Share a photo or video"}
            </span>
          </Button>
        </label>
      </div>

      {/* Feed items */}
      {feed.length === 0 ? (
        <div className="text-center py-16">
          <ImageSquare size={48} weight="duotone" style={{ color: "var(--ht-brand-secondary)" }} className="mx-auto mb-3" />
          <p className="text-sm" style={{ color: "var(--ht-text-tertiary)" }}>No posts yet. Share a photo or harvest something!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {feed.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-2xl border p-4 transition-all duration-300 hover:shadow-md"
              style={{ backgroundColor: "var(--ht-bg-surface)", borderColor: "rgba(19,42,27,0.1)", boxShadow: "0 2px 12px rgba(0,0,0,0.02)" }}
              data-testid={`feed-item-${item.id}`}
            >
              {/* Media content */}
              {item.media_path && <div className="mb-3"><MediaDisplay item={item} /></div>}
              {/* Harvest image (from plant) */}
              {!item.media_path && item.image && item.type === "harvest" && (
                <div className="mb-3">
                  <img src={item.image} alt={item.plant_name} className="w-full rounded-xl max-h-48 object-cover" />
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: item.type === "media" ? "rgba(45,90,60,0.08)" : "rgba(255,107,53,0.12)" }}>
                  {item.type === "media" ? (
                    <Camera size={18} weight="duotone" style={{ color: "var(--ht-brand-primary)" }} />
                  ) : (
                    <Plant size={18} weight="duotone" style={{ color: "var(--ht-harvest)" }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ fontFamily: "Outfit, sans-serif", color: "var(--ht-text-primary)" }}>
                    {item.type === "media" ? (item.notes || "Shared a photo") : `${item.nickname || item.plant_name} harvested!`}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Clock size={12} weight="duotone" style={{ color: "var(--ht-text-tertiary)" }} />
                  <span className="text-xs" style={{ color: "var(--ht-text-tertiary)" }}>{timeAgo(item.created_at || item.harvested_at)}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
