import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const NOTIFICATION_COLORS = {
  harvest_ready: "#FF6B35",
  low_water: "#4A90E2",
  low_nutrients: "#8D6B94",
};

function getNotificationColor(type) {
  return NOTIFICATION_COLORS[type] || "#D33F49";
}

export function usePlantActions() {
  const [plants, setPlants] = useState([]);
  const [catalog, setCatalog] = useState([]);

  const fetchPlants = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/plants`);
      setPlants(res.data);
    } catch {
      toast.error("Failed to load plants");
    }
  }, []);

  const fetchCatalog = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/plants/catalog`);
      setCatalog(res.data);
    } catch {
      toast.error("Failed to load plant catalog");
    }
  }, []);

  const addPlant = useCallback(async (catalogId, nickname) => {
    try {
      const res = await axios.post(`${API}/plants`, { catalog_id: catalogId, nickname });
      setPlants((prev) => [...prev, res.data]);
      toast.success(`${res.data.name} added to your tent!`);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to add plant");
    }
  }, []);

  const removePlant = useCallback(async (plantId) => {
    try {
      await axios.delete(`${API}/plants/${plantId}`);
      setPlants((prev) => prev.filter((p) => p.id !== plantId));
      toast("Plant removed from tent");
    } catch {
      toast.error("Failed to remove plant");
    }
  }, []);

  const harvestPlant = useCallback(async (plantId) => {
    try {
      const res = await axios.put(`${API}/plants/${plantId}/harvest`);
      setPlants((prev) => prev.map((p) => (p.id === plantId ? res.data : p)));
      toast.success("Harvest logged!", { style: { borderLeft: "4px solid #FF6B35" } });
    } catch {
      toast.error("Failed to harvest plant");
    }
  }, []);

  useEffect(() => {
    fetchPlants();
    fetchCatalog();
  }, [fetchPlants, fetchCatalog]);

  return { plants, catalog, addPlant, removePlant, harvestPlant, fetchPlants };
}

export function useTentStatus() {
  const [tentStatus, setTentStatus] = useState(null);

  const fetchTentStatus = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/tent/status`);
      setTentStatus(res.data);
    } catch {
      toast.error("Failed to load tent status");
    }
  }, []);

  const updateTentStatus = useCallback(async (newStatus) => {
    try {
      const res = await axios.put(`${API}/tent/status`, newStatus);
      setTentStatus(res.data);
    } catch {
      toast.error("Failed to update tent status");
    }
  }, []);

  useEffect(() => {
    fetchTentStatus();
  }, [fetchTentStatus]);

  return { tentStatus, updateTentStatus, fetchTentStatus };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/notifications`);
      setNotifications(res.data);
    } catch {
      toast.error("Failed to load notifications");
    }
  }, []);

  const markNotificationRead = useCallback(async (id) => {
    try {
      await axios.put(`${API}/notifications/${id}/read`);
      fetchNotifications();
    } catch {
      toast.error("Failed to dismiss notification");
    }
  }, [fetchNotifications]);

  const checkNotifications = useCallback(async () => {
    try {
      const res = await axios.post(`${API}/notifications/check`);
      if (res.data.count > 0) {
        fetchNotifications();
        res.data.new_notifications.forEach((n) => {
          toast(n.message, {
            style: { borderLeft: `4px solid ${getNotificationColor(n.type)}` },
          });
        });
      }
    } catch (error) {
      // Background check — log but don't toast to avoid spamming UI
      if (error.response) {
        toast.error("Failed to check notifications");
      }
    }
  }, [fetchNotifications]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return { notifications, checkNotifications, markNotificationRead, fetchNotifications };
}
