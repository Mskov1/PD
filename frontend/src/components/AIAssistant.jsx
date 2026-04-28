import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { PaperPlaneTilt, Robot, VideoCamera, YoutubeLogo, Trash } from "@phosphor-icons/react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AIAssistant() {
  const [message, setMessage] = useState("");
  const [model, setModel] = useState("claude");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTutorials, setShowTutorials] = useState(false);
  const [tutorials, setTutorials] = useState([]);
  const [showAddTutorial, setShowAddTutorial] = useState(false);
  const [tutorialForm, setTutorialForm] = useState({ title: "", youtube_url: "" });
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchHistory();
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
      toast.error("AI request failed");
    } finally {
      setLoading(false);
    }
  };

  const addTutorial = async () => {
    if (!tutorialForm.title) return;
    try {
      await axios.post(`${API}/tutorials`, { ...tutorialForm, description: "", plant_type: "" });
      toast.success("Tutorial added!");
      setTutorialForm({ title: "", youtube_url: "" });
      setShowAddTutorial(false);
      fetchTutorials();
    } catch (e) {
      toast.error("Failed to add tutorial");
    }
  };

  const deleteTutorial = async (id) => {
    try {
      await axios.delete(`${API}/tutorials/${id}`);
      fetchTutorials();
    } catch (e) {
      toast.error("Failed to delete");
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
      toast.error("Upload failed");
    }
  };

  const getYoutubeEmbedUrl = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  return (
    <div className="flex flex-col h-full" data-testid="ai-assistant">
      {/* Model selector + tutorials toggle */}
      <div className="px-5 py-3 flex items-center gap-2 border-b" style={{ borderColor: "rgba(19,42,27,0.06)" }}>
        <Select value={model} onValueChange={setModel}>
          <SelectTrigger data-testid="ai-model-select" className="w-32 h-8 rounded-full text-xs" style={{ borderColor: "rgba(19,42,27,0.15)" }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="claude">Claude Sonnet</SelectItem>
            <SelectItem value="gpt">GPT-5.2</SelectItem>
          </SelectContent>
        </Select>
        <Button
          data-testid="toggle-tutorials"
          variant="ghost"
          size="sm"
          className="rounded-full text-xs h-8 ml-auto"
          onClick={() => { setShowTutorials(!showTutorials); if (!showTutorials) fetchTutorials(); }}
          style={{ color: "var(--ht-text-secondary)" }}
        >
          <VideoCamera size={14} weight="duotone" className="mr-1" />
          Tutorials
        </Button>
      </div>

      {showTutorials ? (
        /* Tutorials view */
        <ScrollArea className="flex-1">
          <div className="p-5 space-y-3">
            <div className="flex gap-2">
              <Dialog open={showAddTutorial} onOpenChange={setShowAddTutorial}>
                <DialogTrigger asChild>
                  <Button
                    data-testid="add-tutorial-btn"
                    size="sm"
                    className="rounded-full text-xs h-8 px-3"
                    style={{ backgroundColor: "var(--ht-brand-primary)", color: "#fff" }}
                  >
                    <YoutubeLogo size={12} className="mr-1" /> Add YouTube
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-2xl" style={{ backgroundColor: "var(--ht-bg-surface)" }}>
                  <DialogHeader>
                    <DialogTitle style={{ fontFamily: "Outfit, sans-serif" }}>Add Tutorial</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 mt-2">
                    <Input data-testid="tutorial-title-input" placeholder="Title" value={tutorialForm.title} onChange={(e) => setTutorialForm((p) => ({ ...p, title: e.target.value }))} className="rounded-xl" />
                    <Input data-testid="tutorial-url-input" placeholder="YouTube URL" value={tutorialForm.youtube_url} onChange={(e) => setTutorialForm((p) => ({ ...p, youtube_url: e.target.value }))} className="rounded-xl" />
                    <Button data-testid="save-tutorial-btn" onClick={addTutorial} disabled={!tutorialForm.title} className="w-full rounded-xl" style={{ backgroundColor: "var(--ht-brand-primary)", color: "#fff" }}>Save</Button>
                  </div>
                </DialogContent>
              </Dialog>
              <label>
                <input type="file" accept="video/*" className="hidden" onChange={uploadVideo} data-testid="video-upload-input" />
                <Button data-testid="upload-video-btn" variant="outline" size="sm" className="rounded-full text-xs h-8 px-3 cursor-pointer" asChild>
                  <span><VideoCamera size={12} className="mr-1" /> Upload</span>
                </Button>
              </label>
            </div>
            {tutorials.length === 0 ? (
              <p className="text-xs text-center py-8" style={{ color: "var(--ht-text-tertiary)" }}>No tutorials yet</p>
            ) : (
              tutorials.map((t) => (
                <div key={t.id} className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(19,42,27,0.08)" }} data-testid={`tutorial-card-${t.id}`}>
                  {t.youtube_url && getYoutubeEmbedUrl(t.youtube_url) && (
                    <div className="aspect-video">
                      <iframe src={getYoutubeEmbedUrl(t.youtube_url)} title={t.title} className="w-full h-full" allowFullScreen />
                    </div>
                  )}
                  {t.video_path && (
                    <div className="aspect-video bg-black">
                      <video src={`${API}/tutorials/video/${t.video_path}`} controls className="w-full h-full" />
                    </div>
                  )}
                  <div className="p-3 flex items-center justify-between">
                    <span className="text-xs font-medium truncate" style={{ color: "var(--ht-text-primary)" }}>{t.title}</span>
                    <button onClick={() => deleteTutorial(t.id)} className="text-xs" style={{ color: "var(--ht-error)" }} data-testid={`delete-tutorial-${t.id}`}>
                      <Trash size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      ) : (
        /* Chat view */
        <>
          <ScrollArea className="flex-1">
            <div className="p-5 space-y-4">
              {chatHistory.length === 0 && (
                <div className="text-center py-12">
                  <Robot size={40} weight="duotone" style={{ color: "var(--ht-brand-secondary)" }} className="mx-auto mb-2" />
                  <p className="text-xs" style={{ color: "var(--ht-text-tertiary)" }}>Ask me anything about hydroponic gardening!</p>
                </div>
              )}
              {chatHistory.map((chat, i) => (
                <div key={chat.id || i} className="space-y-2">
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-md px-3 py-2 text-xs" style={{ backgroundColor: "var(--ht-brand-primary)", color: "#fff" }}>
                      {chat.question}
                    </div>
                  </div>
                  {chat.answer ? (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] rounded-2xl rounded-tl-md px-3 py-2 text-xs whitespace-pre-wrap" style={{ backgroundColor: "var(--ht-bg-secondary)", color: "var(--ht-text-primary)" }}>
                        {chat.answer}
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-start">
                      <div className="rounded-2xl rounded-tl-md px-3 py-2" style={{ backgroundColor: "var(--ht-bg-secondary)" }}>
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: "var(--ht-brand-primary)", animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: "var(--ht-brand-primary)", animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: "var(--ht-brand-primary)", animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </ScrollArea>

          <div className="px-5 py-3 border-t" style={{ borderColor: "rgba(19,42,27,0.06)" }}>
            <div className="flex gap-2">
              <Input
                data-testid="ai-chat-input"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="How do I grow basil?"
                className="rounded-full h-9 px-4 text-xs"
                style={{ borderColor: "rgba(19,42,27,0.15)" }}
                disabled={loading}
              />
              <Button
                data-testid="ai-send-btn"
                onClick={sendMessage}
                disabled={!message.trim() || loading}
                className="rounded-full h-9 w-9 p-0 transition-all active:scale-95"
                style={{ backgroundColor: "var(--ht-brand-accent)", color: "var(--ht-text-primary)" }}
              >
                <PaperPlaneTilt size={16} weight="bold" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
