import { useState, useRef, useCallback } from "react";
import { useAppContext, ConsultationReport } from "@/context/AppContext";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, MicOff, Send, Upload, X, ChevronLeft, ChevronRight,
  AlertTriangle, CheckCircle2, FileDown, MapPin
} from "lucide-react";
import bodyModelImg from "@/assets/body-model.png";
import logo from "@/assets/logo.png";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
}

const bodyPoints = [
  { id: "head", label: "Head/Scalp", x: 50, y: 8 },
  { id: "face", label: "Face", x: 50, y: 14 },
  { id: "neck", label: "Neck", x: 50, y: 20 },
  { id: "left-shoulder", label: "Left Shoulder", x: 32, y: 25 },
  { id: "right-shoulder", label: "Right Shoulder", x: 68, y: 25 },
  { id: "chest", label: "Chest", x: 50, y: 32 },
  { id: "left-arm", label: "Left Arm", x: 22, y: 38 },
  { id: "right-arm", label: "Right Arm", x: 78, y: 38 },
  { id: "abdomen", label: "Abdomen", x: 50, y: 45 },
  { id: "left-forearm", label: "Left Forearm", x: 18, y: 50 },
  { id: "right-forearm", label: "Right Forearm", x: 82, y: 50 },
  { id: "left-hand", label: "Left Hand", x: 14, y: 60 },
  { id: "right-hand", label: "Right Hand", x: 86, y: 60 },
  { id: "left-thigh", label: "Left Thigh", x: 38, y: 60 },
  { id: "right-thigh", label: "Right Thigh", x: 62, y: 60 },
  { id: "left-knee", label: "Left Knee", x: 38, y: 72 },
  { id: "right-knee", label: "Right Knee", x: 62, y: 72 },
  { id: "left-leg", label: "Left Leg", x: 38, y: 82 },
  { id: "right-leg", label: "Right Leg", x: 62, y: 82 },
  { id: "left-foot", label: "Left Foot", x: 38, y: 93 },
  { id: "right-foot", label: "Right Foot", x: 62, y: 93 },
];

const mockAIResponse = (input: string, selectedArea: string): string => {
  const area = selectedArea || "the affected area";
  return `Based on your description of "${input}" on ${area}, I can see potential signs of a dermatological condition. 

**Preliminary Analysis:**
- 🔴 **90% - Contact Dermatitis**: Redness, itching, and inflammation consistent with an allergic reaction
- 🟡 **75% - Eczema (Atopic Dermatitis)**: Dry, flaky patches that may worsen with stress
- 🟢 **45% - Psoriasis**: Could present with scaling if symptoms persist

**Common symptoms to watch:**
• Persistent itching or burning
• Spreading redness
• Dry, cracking skin
• Small fluid-filled blisters

⚠️ *This is AI-generated advice, not a substitute for professional medical diagnosis.*`;
};

const Consultation = () => {
  const { patient, addReport } = useAppContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedArea, setSelectedArea] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: `Hello ${patient.name || "there"}! I'm your AI Skin Consultation Assistant. Please select an area on the body model and describe your symptoms. You can also upload an image for better analysis.`,
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

  const handleSend = useCallback(() => {
    if (!input.trim() && !uploadedImage) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      imageUrl: uploadedImage || undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setUploadedImage(null);
    setIsLoading(true);
    scrollToBottom();

    setTimeout(() => {
      const aiContent = mockAIResponse(input, selectedArea);
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: aiContent },
      ]);
      setIsLoading(false);
      setShowResults(true);
      scrollToBottom();
    }, 1500);
  }, [input, uploadedImage, selectedArea]);

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
      const reader = new FileReader();
      reader.onload = (ev) => setUploadedImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateReport = () => {
    const report: ConsultationReport = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      selectedArea: selectedArea || "General",
      symptoms: ["Itching", "Redness", "Burning sensation"],
      imageUrl: uploadedImage || undefined,
      aiAnalysis: {
        conditions: [
          { name: "Contact Dermatitis", probability: 90, symptoms: ["Redness", "Itching", "Inflammation"] },
          { name: "Eczema", probability: 75, symptoms: ["Dry patches", "Flaking", "Cracking"] },
          { name: "Psoriasis", probability: 45, symptoms: ["Scaling", "Plaques", "Silvery patches"] },
        ],
        whatToAvoid: ["Harsh soaps", "Direct sunlight", "Spicy foods", "Hot showers"],
        remedies: ["Apply aloe vera gel", "Use prescribed emollient", "Consult dermatologist"],
      },
    };
    addReport(report);
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 py-4">
        <h2 className="text-2xl font-bold text-center mb-4">
          AI Skin Consultation for {patient.name || "Patient"}
        </h2>

        <div className="flex gap-4 relative">
          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute left-0 top-0 z-10 p-1 bg-primary text-primary-foreground rounded-r-lg"
            style={{ left: sidebarOpen ? "calc(40% - 12px)" : "-4px" }}
          >
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          {/* Step 1: Visual Input - Body model & image upload */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "40%", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex-shrink-0 overflow-hidden"
              >
                <div className="glass-card rounded-2xl overflow-hidden">
                  <div className="gradient-primary text-primary-foreground p-3">
                    <h3 className="font-semibold">Step 1: Visual Input</h3>
                  </div>

                  {/* Body model */}
                  <div className="relative p-4">
                    <div className="relative mx-auto" style={{ maxWidth: 280 }}>
                      <img src={bodyModelImg} alt="Body model" className="w-full rounded-xl" />
                      {bodyPoints.map((point) => (
                        <button
                          key={point.id}
                          onClick={() => setSelectedArea(point.label)}
                          className={`absolute w-4 h-4 rounded-full border-2 transition-all transform -translate-x-1/2 -translate-y-1/2 ${
                            selectedArea === point.label
                              ? "bg-accent border-accent scale-150 shadow-lg"
                              : "bg-primary-foreground/60 border-primary/40 hover:scale-125 hover:bg-accent/70"
                          }`}
                          style={{ left: `${point.x}%`, top: `${point.y}%` }}
                          title={point.label}
                        />
                      ))}
                    </div>
                    {selectedArea && (
                      <p className="text-center mt-3 text-sm font-medium bg-secondary px-3 py-1.5 rounded-full inline-block mx-auto">
                        Selected: {selectedArea}
                      </p>
                    )}
                  </div>

                  {/* Image upload */}
                  <div className="p-4 border-t border-border">
                    <h4 className="font-medium mb-2">Upload Symptom Image</h4>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      {uploadedImage ? (
                        <div className="relative">
                          <img src={uploadedImage} alt="Uploaded" className="max-h-32 mx-auto rounded-lg" />
                          <button
                            onClick={(e) => { e.stopPropagation(); setUploadedImage(null); }}
                            className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Drag & drop or click to upload</p>
                        </>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 2: Chat */}
          <div className="flex-1 flex flex-col">
            <div className="glass-card rounded-2xl overflow-hidden flex flex-col" style={{ minHeight: 500 }}>
              <div className="gradient-primary text-primary-foreground p-3">
                <h3 className="font-semibold">Step 2: AI Chat & Analysis</h3>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: 400 }}>
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <img src={logo} alt="" className="h-7 w-7 rounded-full mr-2 flex-shrink-0 mt-1" />
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-secondary text-secondary-foreground rounded-bl-md"
                      }`}
                    >
                      {msg.imageUrl && (
                        <img src={msg.imageUrl} alt="Uploaded" className="max-h-24 rounded-lg mb-2" />
                      )}
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                    {msg.role === "user" && (
                      <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center ml-2 flex-shrink-0 mt-1">
                        <span className="text-xs text-primary-foreground font-bold">
                          {(patient.name || "U")[0]}
                        </span>
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-2">
                    <img src={logo} alt="" className="h-7 w-7 rounded-full" />
                    <div className="bg-secondary rounded-2xl px-4 py-3 flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse_dot" />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse_dot" style={{ animationDelay: "0.3s" }} />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse_dot" style={{ animationDelay: "0.6s" }} />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input bar */}
              <div className="p-4 border-t border-border flex items-center gap-2">
                <button
                  onClick={handleVoice}
                  className={`p-2.5 rounded-full transition-colors ${
                    isListening
                      ? "bg-destructive text-destructive-foreground animate-pulse"
                      : "bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground"
                  }`}
                >
                  {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>

                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type your symptoms..."
                  className="flex-1"
                />

                <Button onClick={handleSend} disabled={isLoading} className="gradient-primary text-primary-foreground">
                  <Send className="h-4 w-4" />
                </Button>

                <button
                  onClick={handleVoice}
                  className="p-2.5 rounded-full bg-success text-success-foreground hover:opacity-80 transition-opacity"
                >
                  <Mic className="h-5 w-5" />
                  <span className="sr-only">Voice Input</span>
                </button>
              </div>
            </div>

            {/* AI Prescription Results */}
            <AnimatePresence>
              {showResults && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card rounded-2xl p-6 mt-4"
                >
                  <h3 className="text-lg font-bold text-center mb-4">Your Personalized AI Prescription (Preliminary)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-destructive/10 rounded-xl p-4">
                      <h4 className="font-semibold flex items-center gap-2 mb-3">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        What to Avoid
                      </h4>
                      <ul className="space-y-1 text-sm">
                        {["Harsh soaps", "Direct sunlight", "Spicy foods", "Hot showers"].map((item) => (
                          <li key={item}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-success/10 rounded-xl p-4">
                      <h4 className="font-semibold flex items-center gap-2 mb-3">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        Medical Care & Home Remedies
                      </h4>
                      <ul className="space-y-1 text-sm">
                        {["Apply aloe vera gel", "Consult dermatologist (Map below)", "Use prescribed emollient"].map((item) => (
                          <li key={item}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    Note: This is AI-generated advice, not a substitute for professional medical diagnosis.
                  </p>
                  <div className="flex justify-center gap-3 mt-4">
                    <Button onClick={handleGenerateReport} className="gradient-primary text-primary-foreground">
                      <FileDown className="h-4 w-4 mr-2" /> Save Report
                    </Button>
                    <Button variant="outline" asChild>
                      <a href="/map"><MapPin className="h-4 w-4 mr-2" /> Find Nearby Doctors</a>
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Consultation;
