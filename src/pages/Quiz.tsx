import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";

const symptoms = [
  { id: "itching", label: "🪒 Itching" },
  { id: "burning", label: "🔥 Burning" },
  { id: "dryness", label: "🍂 Dryness/Flaking" },
  { id: "pain", label: "🖐 Pain/Tenderness" },
  { id: "bleeding", label: "🩸 Bleeding" },
];

const visualChars = [
  { id: "redness", label: "Redness/Inflammation" },
  { id: "bumps", label: "Bumps/Papules" },
  { id: "scaling", label: "Scaling/Plaques" },
  { id: "blisters", label: "Blisters/Vesicles" },
];

const Quiz = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedVisual, setSelectedVisual] = useState("");
  const [duration, setDuration] = useState("");
  const [triggers, setTriggers] = useState("");
  const [familyHistory, setFamilyHistory] = useState("");
  const [lifestyle, setLifestyle] = useState("");

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const totalSteps = 3;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-center mb-2">Dermatology Self-Assessment Quiz</h1>
        <p className="text-center text-sm text-muted-foreground mb-6">
          Step {step} of {totalSteps}:{" "}
          {step === 1 ? "Symptoms & Appearance" : step === 2 ? "History & Lifestyle" : "Review"}
        </p>

        {/* Progress */}
        <div className="w-full h-2.5 bg-secondary rounded-full mb-8 overflow-hidden">
          <motion.div
            className="h-full gradient-primary rounded-full"
            animate={{ width: `${(step / totalSteps) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="glass-card rounded-2xl p-8">
          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">1. Primary Symptoms (Select all that apply)</h3>
                <div className="flex flex-wrap gap-4">
                  {symptoms.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={selectedSymptoms.includes(s.id)}
                        onCheckedChange={() => toggleSymptom(s.id)}
                      />
                      <span className="text-sm">{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">2. Visual Characteristics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {visualChars.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVisual(v.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-center text-sm ${
                        selectedVisual === v.id
                          ? "border-primary bg-primary/5 shadow-card"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">3. Duration of condition</h3>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger><SelectValue placeholder="Select duration" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="less-1-week">&lt;1 week</SelectItem>
                      <SelectItem value="1-4-weeks">1-4 weeks</SelectItem>
                      <SelectItem value="more-1-month">&gt;1 month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Known Triggers</h3>
                  <Textarea value={triggers} onChange={(e) => setTriggers(e.target.value)} placeholder="e.g., food, stress, new products" rows={3} />
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Family History of Skin Conditions</h3>
                <Textarea value={familyHistory} onChange={(e) => setFamilyHistory(e.target.value)} placeholder="Any family members with eczema, psoriasis, etc.?" rows={3} />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Lifestyle & Habits</h3>
                <Textarea value={lifestyle} onChange={(e) => setLifestyle(e.target.value)} placeholder="Diet, sleep, stress levels, skincare routine..." rows={3} />
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h3 className="font-semibold text-lg">Review Your Responses</h3>
              <div className="bg-secondary/50 rounded-xl p-4 space-y-2 text-sm">
                <p><strong>Symptoms:</strong> {selectedSymptoms.join(", ") || "None selected"}</p>
                <p><strong>Visual:</strong> {selectedVisual || "None selected"}</p>
                <p><strong>Duration:</strong> {duration || "Not specified"}</p>
                <p><strong>Triggers:</strong> {triggers || "None"}</p>
                <p><strong>Family History:</strong> {familyHistory || "None"}</p>
                <p><strong>Lifestyle:</strong> {lifestyle || "Not provided"}</p>
              </div>
              <p className="text-xs text-muted-foreground">Your responses help build a comprehensive profile for better AI analysis.</p>
            </motion.div>
          )}

          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">Back</Button>
            )}
            <Button
              onClick={() => {
                if (step < totalSteps) setStep(step + 1);
                else navigate("/consultation");
              }}
              className="flex-1 gradient-primary text-primary-foreground"
            >
              {step < totalSteps ? `Next Step: ${step === 1 ? "History & Lifestyle" : "Review"}` : "Start AI Consultation"}
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Your responses help build a comprehensive profile for better AI analysis.
        </p>
      </div>
    </AppLayout>
  );
};

export default Quiz;
