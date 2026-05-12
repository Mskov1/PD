import { useState, useEffect, useCallback, useMemo } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "sonner";
import { Plant, Gauge, Users, ChatCircleDots, X } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import SimpleUI from "@/components/SimpleUI";
import ControlPanel from "@/components/ControlPanel";
import AIAssistant from "@/components/AIAssistant";
import CommunityFeed from "@/components/CommunityFeed";
import NotificationCenter from "@/components/NotificationCenter";
import { usePlantActions, useTentStatus, useNotifications } from "@/hooks/useHydroTent";

const TAB_ITEMS = [
  { value: "simple", label: "My Tent", icon: <Plant size={18} weight="duotone" /> },
  { value: "control", label: "Control Panel", icon: <Gauge size={18} weight="duotone" /> },
  { value: "community", label: "Community", icon: <Users size={18} weight="duotone" /> },
];

const TAB_TRANSITION = { duration: 0.25, ease: "easeOut" };
const DRAWER_TRANSITION = { type: "spring", damping: 25, stiffness: 300 };
const BACKDROP_INITIAL = { opacity: 0 };
const BACKDROP_ANIMATE = { opacity: 1 };
const DRAWER_INITIAL = { x: "100%" };
const DRAWER_ANIMATE = { x: 0 };

function AIDrawer({ open, onClose }) {
  if (!open) return null;
  return (
    <>
      <motion.div
        initial={BACKDROP_INITIAL}
        animate={BACKDROP_ANIMATE}
        exit={BACKDROP_INITIAL}
        className="fixed inset-0 z-50"
        style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
        onClick={onClose}
      />
      <motion.div
        initial={DRAWER_INITIAL}
        animate={DRAWER_ANIMATE}
        exit={DRAWER_INITIAL}
        transition={DRAWER_TRANSITION}
        className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[440px] flex flex-col"
        style={{ backgroundColor: "var(--ht-bg-surface)", boxShadow: "-4px 0 24px rgba(0,0,0,0.08)" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(19,42,27,0.08)" }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "var(--ht-brand-accent)", boxShadow: "0 0 12px rgba(212,255,30,0.3)" }}>
              <ChatCircleDots size={16} weight="duotone" style={{ color: "var(--ht-text-primary)" }} />
            </div>
            <span className="text-sm font-medium" style={{ fontFamily: "Outfit, sans-serif" }}>HydroTent AI</span>
          </div>
          <button data-testid="close-ai-drawer" onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ color: "var(--ht-text-tertiary)" }}>
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <AIAssistant />
        </div>
      </motion.div>
    </>
  );
}

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("simple");
  const [showAI, setShowAI] = useState(false);

  const { plants, catalog, addPlant, removePlant, harvestPlant } = usePlantActions();
  const { tentStatus, updateTentStatus, fetchTentStatus } = useTentStatus();
  const { notifications, checkNotifications, markNotificationRead } = useNotifications();

  const openAI = useCallback(() => setShowAI(true), []);
  const closeAI = useCallback(() => setShowAI(false), []);

  useEffect(() => {
    const interval = setInterval(() => {
      checkNotifications();
      fetchTentStatus();
    }, 60000);
    return () => clearInterval(interval);
  }, [checkNotifications, fetchTentStatus]);

  const tabInitial = useMemo(() => ({ opacity: 0, y: 12 }), []);
  const tabAnimate = useMemo(() => ({ opacity: 1, y: 0 }), []);
  const tabExit = useMemo(() => ({ opacity: 0, y: -12 }), []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--ht-bg-page)" }}>
      <Toaster position="top-right" richColors theme="light" />

      <header className="sticky top-0 z-40 border-b" style={{ backgroundColor: "var(--ht-bg-surface)", borderColor: "rgba(19,42,27,0.1)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--ht-brand-primary)" }}>
                <Plant size={20} weight="duotone" color="#D4FF1E" />
              </div>
              <h1 className="text-xl font-medium tracking-tight" style={{ fontFamily: "Outfit, sans-serif", color: "var(--ht-text-primary)" }}>
                HydroTent
              </h1>
            </div>
            <NotificationCenter notifications={notifications} onMarkRead={markNotificationRead} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full sm:w-auto mb-6 h-11 p-1 rounded-2xl" style={{ backgroundColor: "var(--ht-bg-secondary)" }}>
            {TAB_ITEMS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} data-testid={`tab-${tab.value}`}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all data-[state=active]:shadow-sm"
                style={{ fontFamily: "DM Sans, sans-serif" }}>
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={tabInitial} animate={tabAnimate} exit={tabExit} transition={TAB_TRANSITION}>
              <TabsContent value="simple" className="mt-0">
                <SimpleUI plants={plants} catalog={catalog} tentStatus={tentStatus} notifications={notifications}
                  onAddPlant={addPlant} onRemovePlant={removePlant} onHarvestPlant={harvestPlant}
                  onMarkNotificationRead={markNotificationRead} onOpenAI={openAI} />
              </TabsContent>
              <TabsContent value="control" className="mt-0">
                <ControlPanel tentStatus={tentStatus} plants={plants} onUpdateStatus={updateTentStatus} />
              </TabsContent>
              <TabsContent value="community" className="mt-0">
                <CommunityFeed />
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </main>

      <button data-testid="ai-fab-button" onClick={openAI}
        className="fixed bottom-20 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        style={{ backgroundColor: "var(--ht-brand-accent)", boxShadow: "0 4px 20px rgba(212,255,30,0.4)", color: "var(--ht-text-primary)" }}>
        <ChatCircleDots size={26} weight="duotone" />
      </button>

      <AnimatePresence>
        {showAI && <AIDrawer open={showAI} onClose={closeAI} />}
      </AnimatePresence>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
