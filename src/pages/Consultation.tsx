import { useState, useRef, useCallback } from "react";
import { useAppContext, ConsultationReport } from "@/context/AppContext";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BodySelector } from "@/components/ui/BodySelector";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, MicOff, Send, Upload, X, ChevronLeft, ChevronRight,
  AlertTriangle, CheckCircle2, FileDown, MapPin
} from "lucide-react";
import logo from "@/assets/logo.png";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
}

// NOTE: mockAIResponse is now deprecated as we use the real server.py API

const Consultation = () => {
  const { patient, addReport } = useAppContext();
  const [sidebarOpen, setSidebarOpen] = useState(true); 
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]); // Handles multiple selection array
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [rawFile, setRawFile] = useState<File | null>(null); // Stores the actual file for the API call
  const [lastQuery, setLastQuery] = useState("");
  const [lastAIResponse, setLastAIResponse] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: `Hello ${patient.name || "there"}! I'm your AI Consultation Assistant. Please select the affected areas on the body model and describe your symptoms.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleSend = useCallback(async () => {
    if (!input.trim() && !rawFile) return;

    const areaString = selectedAreas.join(", ") || "General Area";

    // 1. Display user message in UI
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: `[Areas: ${areaString}] ${input}`, 
      imageUrl: uploadedImage || undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    scrollToBottom();

try {
      setLastQuery(input); // <--- NEW: Save the user's text before clearing

      const formData = new FormData();
      formData.append("text", input);
      formData.append("areas", areaString);
      if (rawFile) formData.append("image", rawFile);

      const response = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Backend server is not responding.");

      const data = await response.json();
      
      setLastAIResponse(data.response); // <--- NEW: Save the AI's exact text

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: data.response },
      ]);
      setShowResults(true);
      
    } catch (error) {
      console.error("🚨 DETAILED BROWSER ERROR:", error); 
      // ... (keep your existing catch error message code here)
    } finally {
      setIsLoading(false);
      setRawFile(null); 
      scrollToBottom();
      // WE REMOVED setUploadedImage(null) SO THE PHOTO STAYS FOR THE PDF!
    }
  }, [input, rawFile, selectedAreas, uploadedImage]);

  const handleVoice = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRawFile(file); // Store the actual file object for the API
      const reader = new FileReader();
      reader.onload = (ev) => setUploadedImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

const handleGenerateReport = () => {
    const report: ConsultationReport = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      selectedArea: selectedAreas.join(", ") || "General",
      symptoms: [lastQuery || "Patient reported symptoms"], // Real symptoms
      imageUrl: uploadedImage || undefined, // Real image
      aiAnalysis: {
        conditions: [
          { name: "AI Clinical Assessment Completed", probability: 100, symptoms: [] },
        ],
        whatToAvoid: ["See detailed AI response below"],
        remedies: [lastAIResponse], // Passes the full, real AI text!
      },
    };
    addReport(report);
    alert("Report saved successfully to Supabase Database!");
  };

  return (
    <AppLayout>
      <div className="max-w-[1600px] w-full mx-auto px-6 py-6 h-[calc(100vh-6rem)]">
        <div className="flex gap-6 h-full relative items-start">
          
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute left-0 top-1 z-20 p-1.5 bg-[#2A5C43] text-white rounded-r-lg shadow-md transition-all duration-300"
            style={{ left: sidebarOpen ? "calc(30% - 3px)" : "-8px" }}
          >
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          <AnimatePresence initial={false}>
            {sidebarOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "30%", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="flex-shrink-0 h-full"
              >
                <div className="glass-card rounded-2xl overflow-hidden h-full flex flex-col">
                  <div className="bg-[#2A5C43] text-white p-3 text-center font-semibold">
                    Step 1: Select Area
                  </div>

                  <div className="flex-1 p-4 overflow-y-auto no-scrollbar flex flex-col items-center">
                    <div className="w-full max-w-sm mt-2">
                      <BodySelector 
                        selectedParts={selectedAreas} 
                        onPartsToggle={setSelectedAreas} 
                      />
                    </div>
                  </div>

                  <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
                    <h4 className="font-medium mb-2 text-sm text-[#2A5C43]">Upload Photo</h4>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#2A5C43]/20 rounded-xl p-4 text-center cursor-pointer hover:bg-white transition-all bg-white"
                    >
                      {uploadedImage ? (
                        <div className="relative">
                          <img src={uploadedImage} alt="Uploaded" className="max-h-24 mx-auto rounded-lg object-cover" />
                          <button
                            onClick={(e) => { e.stopPropagation(); setUploadedImage(null); setRawFile(null); }}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-sm"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-2 text-gray-500">
                          <Upload className="h-6 w-6 mb-1" />
                          <p className="text-xs">Click to upload symptoms</p>
                        </div>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 h-full flex flex-col min-w-0">
            <div className="glass-card rounded-2xl overflow-hidden flex flex-col h-full bg-white/70 backdrop-blur-md border border-white/40">
              <div className="bg-[#2A5C43] text-white p-3 flex-shrink-0 font-semibold">
                Step 2: AI Clinical Analysis
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <img src={logo} alt="AI" className="h-10 w-10 rounded-full mr-3 flex-shrink-0 mt-1 bg-white/90 p-0.5 shadow-sm" />
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-6 py-4 text-base shadow-sm ${
                        msg.role === "user"
                          ? "bg-[#2A5C43] text-white rounded-br-md"
                          : "bg-white text-gray-800 border border-gray-100 rounded-bl-md shadow-md"
                      }`}
                    >
                      {msg.imageUrl && (
                        <img src={msg.imageUrl} alt="Uploaded" className="max-h-48 rounded-lg mb-3 object-cover" />
                      )}
                      <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-3">
                    <img src={logo} alt="AI Loading" className="h-10 w-10 rounded-full bg-white/90 p-0.5 shadow-sm animate-pulse" />
                    <div className="bg-white rounded-2xl px-5 py-4 border border-gray-100 shadow-sm text-gray-400 text-sm">
                      DermSight is analyzing clinical guidelines...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <AnimatePresence>
                {showResults && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="p-4 bg-white/90 border-t flex justify-center gap-4"
                  >
                     <Button onClick={handleGenerateReport} className="bg-[#2A5C43] text-white h-10 px-6 hover:bg-[#1e4230]">
                        <FileDown className="mr-2 h-4 w-4" /> Save Report
                     </Button>
                     <Button variant="outline" asChild className="border-[#2A5C43] text-[#2A5C43] hover:bg-gray-50 h-10 px-6">
                        <a href="/map"><MapPin className="mr-2 h-4 w-4" /> Find Nearby Clinics</a>
                     </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="p-4 border-t bg-white flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={handleVoice}
                  className={`p-3 rounded-full transition-all ${
                    isListening ? "bg-red-500 text-white animate-pulse" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>

                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Describe symptoms or ask the AI..."
                  className="flex-1 h-12 bg-gray-50 border-none rounded-xl"
                />

                <Button 
                  onClick={handleSend} 
                  disabled={isLoading} 
                  className="bg-[#2A5C43] text-white shadow-md h-12 w-12 rounded-xl hover:bg-[#1e4230]"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Consultation;