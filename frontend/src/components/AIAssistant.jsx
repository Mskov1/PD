import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { PaperPlaneTilt, Robot, Microphone, MicrophoneSlash, VideoCamera, YoutubeLogo, Trash, Play } from "@phosphor-icons/react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

/* ── Visual example of a video answer ── */
function VideoAnswerExample() {
  return (
    <div className="rounded-xl overflow-hidden border" style={{ borderColor: "rgba(19,42,27,0.1)" }}>
      <div className="relative aspect-video" style={{ backgroundColor: "#1a1a1a" }}>
        <img
          src="https://images.pexels.com/photos/28129605/pexels-photo-28129605.jpeg?auto=compress&cs=tinysrgb&w=600&h=340&fit=crop"
          alt="Hydroponic tutorial"
          className="w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.9)" }}>
            <Play size={20} weight="fill" style={{ color: "var(--ht-brand-primary)" }} />
          </div>
        </div>
        <div className="absolute bottom-2 left-3 right-3">
          <div className="rounded-lg px-2 py-1" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
            <p className="text-[10px] text-white font-medium">How to change water in your HydroTent</p>
            <p className="text-[9px] text-white/60">2:34</p>
          </div>
        </div>
      </div>
      <div className="p-3" style={{ backgroundColor: "var(--ht-bg-secondary)" }}>
        <p className="text-[10px]" style={{ color: "var(--ht-text-secondary)" }}>
          Here's a step-by-step video showing how to change the water. The key steps are: drain, clean, refill with fresh nutrient solution.
        </p>
      </div>
    </div>
  );
}

/* ── Chat message bubble ── */
function ChatMessage({ chat }) {
  return (
    <div className="space-y-2">
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
  );
}

/* ── Tutorial list view ── */
function TutorialList({ tutorials, onAdd, onDelete, onUpload }) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [form, setForm] = useState({ title: "", youtube_url: "" });

  const handleSave = () => {
    if (!form.title) return;
    onAdd(form);
    setForm({ title: "", youtube_url: "" });
    setShowAddDialog(false);
  };

  const getYoutubeEmbedUrl = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  return (
    <ScrollArea className="flex-1">
      <div className="p-5 space-y-3">
        <div className="flex gap-2">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button data-testid="add-tutorial-btn" size="sm" className="rounded-full text-xs h-8 px-3" style={{ backgroundColor: "var(--ht-brand-primary)", color: "#fff" }}>
                <YoutubeLogo size={12} className="mr-1" /> Add
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl" style={{ backgroundColor: "var(--ht-bg-surface)" }}>
              <DialogHeader>
                <DialogTitle style={{ fontFamily: "Outfit, sans-serif" }}>Add Tutorial</DialogTitle>
                <DialogDescription className="sr-only">Add a YouTube tutorial link</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <Input data-testid="tutorial-title-input" placeholder="Title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="rounded-xl" />
                <Input data-testid="tutorial-url-input" placeholder="YouTube URL" value={form.youtube_url} onChange={(e) => setForm((p) => ({ ...p, youtube_url: e.target.value }))} className="rounded-xl" />
                <Button data-testid="save-tutorial-btn" onClick={handleSave} disabled={!form.title} className="w-full rounded-xl" style={{ backgroundColor: "var(--ht-brand-primary)", color: "#fff" }}>Save</Button>
              </div>
            </DialogContent>
          </Dialog>
          <label>
            <input type="file" accept="video/*" className="hidden" onChange={onUpload} data-testid="video-upload-input" />
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
                <div className="aspect-video"><iframe src={getYoutubeEmbedUrl(t.youtube_url)} title={t.title} className="w-full h-full" allowFullScreen /></div>
              )}
              {t.video_path && (
                <div className="aspect-video bg-black"><video src={`${API}/tutorials/video/${t.video_path}`} controls className="w-full h-full" /></div>
              )}
              <div className="p-3 flex items-center justify-between">
                <span className="text-xs font-medium truncate">{t.title}</span>
                <button onClick={() => onDelete(t.id)} style={{ color: "var(--ht-error)" }} data-testid={`delete-tutorial-${t.id}`}><Trash size={12} /></button>
              </div>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
}

/* ── Speech recognition hook ── */
function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const onResultRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResultRef.current?.(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;

    return () => { recognition.abort(); };
  }, []);

  const toggle = useCallback((onResult) => {
    onResultRef.current = onResult;
    if (!recognitionRef.current) {
      toast.error("Voice input not supported in this browser");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  return { isListening, toggle };
}

/* ── Main AIAssistant component ── */
export default function AIAssistant() {
  const [message, setMessage] = useState("");
  const [model, setModel] = useState("claude");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTutorials, setShowTutorials] = useState(false);
  const [tutorials, setTutorials] = useState([]);
  const [showVideoExample, setShowVideoExample] = useState(true);
  const chatEndRef = useRef(null);
  const { isListening, toggle: toggleListening } = useSpeechRecognition();

  const fetchHistory = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/ai/history`);
      setChatHistory(res.data.reverse());
    } catch {
      toast.error("Failed to load chat history");
    }
  }, []);

  const fetchTutorials = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/tutorials`);
      setTutorials(res.data);
    } catch {
      toast.error("Failed to load tutorials");
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const sendMessage = useCallback(async () => {
    if (!message.trim() || loading) return;
    const userMsg = message.trim();
    setMessage("");
    setShowVideoExample(false);
    setChatHistory((prev) => [...prev, { question: userMsg, answer: null, model, id: "pending" }]);
    setLoading(true);

    try {
      const res = await axios.post(`${API}/ai/chat`, { message: userMsg, model });
      setChatHistory((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = res.data;
        return updated;
      });
    } catch {
      setChatHistory((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], answer: "Sorry, something went wrong. Try again.", id: "error" };
        return updated;
      });
      toast.error("AI request failed");
    } finally {
      setLoading(false);
    }
  }, [message, loading, model]);

  const addTutorial = useCallback(async (form) => {
    try {
      await axios.post(`${API}/tutorials`, { ...form, description: "", plant_type: "" });
      toast.success("Tutorial added!");
      fetchTutorials();
    } catch {
      toast.error("Failed to add tutorial");
    }
  }, [fetchTutorials]);

  const deleteTutorial = useCallback(async (id) => {
    try {
      await axios.delete(`${API}/tutorials/${id}`);
      fetchTutorials();
    } catch {
      toast.error("Failed to delete");
    }
  }, [fetchTutorials]);

  const uploadVideo = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", file.name);
    try {
      toast.info("Uploading...");
      await axios.post(`${API}/tutorials/upload`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Video uploaded!");
      fetchTutorials();
    } catch {
      toast.error("Upload failed");
    }
  }, [fetchTutorials]);

  const handleToggleTutorials = useCallback(() => {
    setShowTutorials((prev) => {
      if (!prev) fetchTutorials();
      return !prev;
    });
  }, [fetchTutorials]);

  return (
    <div className="flex flex-col h-full" data-testid="ai-assistant">
      {/* Top bar */}
      <div className="px-5 py-3 flex items-center gap-2 border-b" style={{ borderColor: "rgba(19,42,27,0.06)" }}>
        <Select value={model} onValueChange={setModel}>
          <SelectTrigger data-testid="ai-model-select" className="w-32 h-8 rounded-full text-xs" style={{ borderColor: "rgba(19,42,27,0.15)" }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="claude">Claude</SelectItem>
            <SelectItem value="gpt">GPT-5.2</SelectItem>
          </SelectContent>
        </Select>
        <Button
          data-testid="toggle-tutorials"
          variant="ghost" size="sm"
          className="rounded-full text-xs h-8 ml-auto"
          onClick={handleToggleTutorials}
          style={{ color: "var(--ht-text-secondary)" }}
        >
          <VideoCamera size={14} weight="duotone" className="mr-1" /> Videos
        </Button>
      </div>

      {showTutorials ? (
        <TutorialList tutorials={tutorials} onAdd={addTutorial} onDelete={deleteTutorial} onUpload={uploadVideo} />
      ) : (
        <>
          <ScrollArea className="flex-1">
            <div className="p-5 space-y-4">
              {chatHistory.length === 0 && showVideoExample && (
                <div className="space-y-4">
                  <div className="text-center">
                    <Robot size={36} weight="duotone" style={{ color: "var(--ht-brand-secondary)" }} className="mx-auto mb-2" />
                    <p className="text-sm font-medium" style={{ fontFamily: "Outfit, sans-serif", color: "var(--ht-text-primary)" }}>Ask me anything!</p>
                    <p className="text-xs mt-1" style={{ color: "var(--ht-text-tertiary)" }}>Type or tap the microphone to speak</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {["How to change water?", "When to harvest?", "What nutrients?"].map((q) => (
                      <button key={q} onClick={() => setMessage(q)} className="text-[10px] rounded-full px-3 py-1.5 border transition-all hover:-translate-y-0.5" style={{ borderColor: "rgba(19,42,27,0.12)", color: "var(--ht-text-secondary)" }} data-testid={`suggestion-${q.slice(0, 10).replace(/\s/g, "-")}`}>{q}</button>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-end">
                      <div className="rounded-2xl rounded-tr-md px-3 py-2 text-xs" style={{ backgroundColor: "var(--ht-brand-primary)", color: "#fff" }}>How do I change the water?</div>
                    </div>
                    <div className="flex justify-start"><div className="max-w-[90%]"><VideoAnswerExample /></div></div>
                    <p className="text-[9px] text-center italic" style={{ color: "var(--ht-text-tertiary)" }}>Example of how answers can include video tutorials</p>
                  </div>
                </div>
              )}
              {chatHistory.length === 0 && !showVideoExample && (
                <div className="text-center py-6">
                  <Robot size={36} weight="duotone" style={{ color: "var(--ht-brand-secondary)" }} className="mx-auto mb-2" />
                  <p className="text-xs" style={{ color: "var(--ht-text-tertiary)" }}>Ask me anything!</p>
                </div>
              )}
              {chatHistory.map((chat) => (
                <ChatMessage key={chat.id} chat={chat} />
              ))}
              <div ref={chatEndRef} />
            </div>
          </ScrollArea>

          <div className="px-5 py-3 border-t" style={{ borderColor: "rgba(19,42,27,0.06)" }}>
            <div className="flex gap-2">
              <Button
                data-testid="voice-input-btn"
                onClick={() => toggleListening(setMessage)}
                variant="ghost"
                className="rounded-full h-9 w-9 p-0 flex-shrink-0 transition-all"
                style={{ backgroundColor: isListening ? "rgba(211,63,73,0.12)" : "transparent", color: isListening ? "var(--ht-error)" : "var(--ht-text-tertiary)" }}
              >
                {isListening ? <MicrophoneSlash size={18} weight="fill" /> : <Microphone size={18} weight="duotone" />}
              </Button>
              <Input
                data-testid="ai-chat-input"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder={isListening ? "Listening..." : "Ask a question..."}
                className="rounded-full h-9 px-4 text-xs"
                style={{ borderColor: isListening ? "var(--ht-error)" : "rgba(19,42,27,0.15)" }}
                disabled={loading}
              />
              <Button
                data-testid="ai-send-btn"
                onClick={sendMessage}
                disabled={!message.trim() || loading}
                className="rounded-full h-9 w-9 p-0 flex-shrink-0 transition-all active:scale-95"
                style={{ backgroundColor: "var(--ht-brand-accent)", color: "var(--ht-text-primary)" }}
              >
                <PaperPlaneTilt size={16} weight="bold" />
              </Button>
            </div>
            {isListening && (
              <p className="text-[10px] text-center mt-1.5 animate-pulse" style={{ color: "var(--ht-error)" }}>Listening... speak now</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
