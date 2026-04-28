import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { PaperPlaneTilt, Robot, VideoCamera, Plus, YoutubeLogo, Trash } from "@phosphor-icons/react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AIAssistant() {
  const [subTab, setSubTab] = useState("chat");
  const [message, setMessage] = useState("");
  const [model, setModel] = useState("claude");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tutorials, setTutorials] = useState([]);
  const [showAddTutorial, setShowAddTutorial] = useState(false);
  const [tutorialForm, setTutorialForm] = useState({ title: "", description: "", youtube_url: "", plant_type: "" });
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchHistory();
    fetchTutorials();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API}/ai/history`);
      setChatHistory(res.data.reverse());
    } catch (e) { console.error(e); }
  };

  const fetchTutorials = async () => {
    try {
      const res = await axios.get(`${API}/tutorials`);
      setTutorials(res.data);
    } catch (e) { console.error(e); }
  };

  const sendMessage = async () => {
    if (!message.trim() || loading) return;
    const userMsg = message.trim();
    setMessage("");
    setChatHistory((prev) => [...prev, { question: userMsg, answer: null, model, id: "pending" }]);
    setLoading(true);

    try {
      const res = await axios.post(`${API}/ai/chat`, { message: userMsg, model });
      setChatHistory((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = res.data;
        return updated;
      });
    } catch (e) {
      setChatHistory((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          answer: "Sorry, I encountered an error. Please try again.",
          id: "error",
        };
        return updated;
      });
      toast.error("AI request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const addTutorial = async () => {
    if (!tutorialForm.title) return;
    try {
      await axios.post(`${API}/tutorials`, tutorialForm);
      toast.success("Tutorial added!");
      setTutorialForm({ title: "", description: "", youtube_url: "", plant_type: "" });
      setShowAddTutorial(false);
      fetchTutorials();
    } catch (e) {
      toast.error("Failed to add tutorial");
    }
  };

  const deleteTutorial = async (id) => {
    try {
      await axios.delete(`${API}/tutorials/${id}`);
      toast("Tutorial removed");
      fetchTutorials();
    } catch (e) {
      toast.error("Failed to delete tutorial");
    }
  };

  const uploadVideo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", file.name);

    try {
      toast.info("Uploading video...");
      await axios.post(`${API}/tutorials/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Video uploaded!");
      fetchTutorials();
    } catch (e) {
      toast.error("Upload failed. Check file type (mp4, webm, mov, avi).");
    }
  };

  const getYoutubeEmbedUrl = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  return (
    <div className="space-y-6" data-testid="ai-assistant">
      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList className="h-10 p-1 rounded-xl" style={{ backgroundColor: "var(--ht-bg-secondary)" }}>
          <TabsTrigger value="chat" data-testid="ai-chat-tab" className="rounded-lg px-4 text-sm">
            <Robot size={16} weight="duotone" className="mr-2" />
            Ask AI
          </TabsTrigger>
          <TabsTrigger value="tutorials" data-testid="ai-tutorials-tab" className="rounded-lg px-4 text-sm">
            <VideoCamera size={16} weight="duotone" className="mr-2" />
            Tutorials
          </TabsTrigger>
        </TabsList>

        {/* CHAT TAB */}
        <TabsContent value="chat" className="mt-4">
          <div
            className="rounded-3xl border overflow-hidden"
            style={{
              backgroundColor: "var(--ht-bg-surface)",
              borderColor: "rgba(19,42,27,0.1)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.02)",
            }}
          >
            {/* AI badge */}
            <div className="px-6 py-3 flex items-center justify-between border-b" style={{ borderColor: "rgba(19,42,27,0.06)" }}>
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "var(--ht-brand-accent)", boxShadow: "0 0 12px rgba(212,255,30,0.3)" }}
                >
                  <Robot size={16} weight="duotone" style={{ color: "var(--ht-text-primary)" }} />
                </div>
                <span className="text-sm font-medium" style={{ fontFamily: "Outfit, sans-serif" }}>HydroTent AI</span>
              </div>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger data-testid="ai-model-select" className="w-36 h-8 rounded-full text-xs" style={{ borderColor: "rgba(19,42,27,0.15)" }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="claude">Claude Sonnet</SelectItem>
                  <SelectItem value="gpt">GPT-5.2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Chat messages */}
            <ScrollArea className="h-[400px]">
              <div className="p-6 space-y-4">
                {chatHistory.length === 0 && (
                  <div className="text-center py-12">
                    <Robot size={48} weight="duotone" style={{ color: "var(--ht-brand-secondary)" }} className="mx-auto mb-3" />
                    <p className="text-sm" style={{ color: "var(--ht-text-tertiary)" }}>
                      Ask me anything about hydroponic gardening!
                    </p>
                  </div>
                )}
                {chatHistory.map((chat, i) => (
                  <div key={chat.id || i} className="space-y-3">
                    {/* User message */}
                    <div className="flex justify-end">
                      <div
                        className="max-w-[80%] rounded-2xl rounded-tr-md px-4 py-3 text-sm"
                        style={{ backgroundColor: "var(--ht-brand-primary)", color: "#fff" }}
                      >
                        {chat.question}
                      </div>
                    </div>
                    {/* AI response */}
                    {chat.answer ? (
                      <div className="flex justify-start">
                        <div
                          className="max-w-[80%] rounded-2xl rounded-tl-md px-4 py-3 text-sm whitespace-pre-wrap"
                          style={{ backgroundColor: "var(--ht-bg-secondary)", color: "var(--ht-text-primary)" }}
                        >
                          {chat.answer}
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-start">
                        <div
                          className="rounded-2xl rounded-tl-md px-4 py-3"
                          style={{ backgroundColor: "var(--ht-bg-secondary)" }}
                        >
                          <div className="flex gap-1">
                            <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: "var(--ht-brand-primary)", animationDelay: "0ms" }} />
                            <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: "var(--ht-brand-primary)", animationDelay: "150ms" }} />
                            <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: "var(--ht-brand-primary)", animationDelay: "300ms" }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="px-6 py-4 border-t" style={{ borderColor: "rgba(19,42,27,0.06)" }}>
              <div className="flex gap-2">
                <Input
                  data-testid="ai-chat-input"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="How do I grow basil hydroponically?"
                  className="rounded-full h-10 px-4"
                  style={{ borderColor: "rgba(19,42,27,0.15)" }}
                  disabled={loading}
                />
                <Button
                  data-testid="ai-send-btn"
                  onClick={sendMessage}
                  disabled={!message.trim() || loading}
                  className="rounded-full h-10 w-10 p-0 transition-all hover:-translate-y-0.5 active:scale-95"
                  style={{ backgroundColor: "var(--ht-brand-accent)", color: "var(--ht-text-primary)" }}
                >
                  <PaperPlaneTilt size={18} weight="bold" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TUTORIALS TAB */}
        <TabsContent value="tutorials" className="mt-4">
          <div className="space-y-4">
            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Dialog open={showAddTutorial} onOpenChange={setShowAddTutorial}>
                <DialogTrigger asChild>
                  <Button
                    data-testid="add-tutorial-btn"
                    className="rounded-full px-4 h-10 transition-all hover:-translate-y-0.5 active:scale-95"
                    style={{ backgroundColor: "var(--ht-brand-primary)", color: "#fff" }}
                  >
                    <YoutubeLogo size={16} weight="duotone" className="mr-2" />
                    Add YouTube Tutorial
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-3xl" style={{ backgroundColor: "var(--ht-bg-surface)" }}>
                  <DialogHeader>
                    <DialogTitle style={{ fontFamily: "Outfit, sans-serif" }}>Add Tutorial</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 mt-2">
                    <Input
                      data-testid="tutorial-title-input"
                      placeholder="Tutorial title"
                      value={tutorialForm.title}
                      onChange={(e) => setTutorialForm((p) => ({ ...p, title: e.target.value }))}
                      className="rounded-xl"
                    />
                    <Input
                      data-testid="tutorial-url-input"
                      placeholder="YouTube URL"
                      value={tutorialForm.youtube_url}
                      onChange={(e) => setTutorialForm((p) => ({ ...p, youtube_url: e.target.value }))}
                      className="rounded-xl"
                    />
                    <Input
                      data-testid="tutorial-desc-input"
                      placeholder="Description (optional)"
                      value={tutorialForm.description}
                      onChange={(e) => setTutorialForm((p) => ({ ...p, description: e.target.value }))}
                      className="rounded-xl"
                    />
                    <Button
                      data-testid="save-tutorial-btn"
                      onClick={addTutorial}
                      disabled={!tutorialForm.title}
                      className="w-full rounded-xl h-10"
                      style={{ backgroundColor: "var(--ht-brand-primary)", color: "#fff" }}
                    >
                      Save Tutorial
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <label>
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={uploadVideo}
                  data-testid="video-upload-input"
                />
                <Button
                  data-testid="upload-video-btn"
                  variant="outline"
                  className="rounded-full px-4 h-10 cursor-pointer transition-all hover:-translate-y-0.5 active:scale-95"
                  style={{ borderColor: "rgba(19,42,27,0.15)" }}
                  asChild
                >
                  <span>
                    <VideoCamera size={16} weight="duotone" className="mr-2" />
                    Upload Video
                  </span>
                </Button>
              </label>
            </div>

            {/* Tutorial list */}
            {tutorials.length === 0 ? (
              <div className="text-center py-16">
                <VideoCamera size={48} weight="duotone" style={{ color: "var(--ht-brand-secondary)" }} className="mx-auto mb-3" />
                <p className="text-sm" style={{ color: "var(--ht-text-tertiary)" }}>No tutorials yet. Add one to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tutorials.map((t) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border overflow-hidden group"
                    style={{
                      backgroundColor: "var(--ht-bg-surface)",
                      borderColor: "rgba(19,42,27,0.1)",
                      boxShadow: "0 4px 24px rgba(0,0,0,0.02)",
                    }}
                    data-testid={`tutorial-card-${t.id}`}
                  >
                    {t.youtube_url && getYoutubeEmbedUrl(t.youtube_url) ? (
                      <div className="aspect-video">
                        <iframe
                          src={getYoutubeEmbedUrl(t.youtube_url)}
                          title={t.title}
                          className="w-full h-full"
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                      </div>
                    ) : t.video_path ? (
                      <div className="aspect-video bg-black flex items-center justify-center">
                        <video
                          src={`${API}/tutorials/video/${t.video_path}`}
                          controls
                          className="w-full h-full"
                        />
                      </div>
                    ) : null}
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-sm" style={{ fontFamily: "Outfit, sans-serif" }}>{t.title}</h4>
                          {t.description && (
                            <p className="text-xs mt-1" style={{ color: "var(--ht-text-tertiary)" }}>{t.description}</p>
                          )}
                        </div>
                        <Button
                          data-testid={`delete-tutorial-${t.id}`}
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteTutorial(t.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: "var(--ht-error)" }}
                        >
                          <Trash size={14} />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
