import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext, PatientProfile } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { User, Heart, ArrowRight } from "lucide-react";
import logo from "@/assets/logo.png";

const ProfileSetup = () => {
  const { patient, setPatient } = useAppContext();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<PatientProfile>(patient);

  const update = (key: keyof PatientProfile, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  const handleNext = () => {
    if (step === 1) {
      if (!form.name || !form.age || !form.gender) return;
      setStep(2);
    } else {
      setPatient(form);
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="flex items-center justify-center gap-3 mb-8">
          <img src={logo} alt="Aarogyam" className="h-12 w-12 rounded-xl" />
          <h1 className="text-3xl font-bold text-primary">Aarogyam</h1>
        </div>

        <div className="glass-card rounded-2xl p-8">
          <div className="flex items-center gap-2 mb-2">
            {step === 1 ? <User className="h-5 w-5 text-primary" /> : <Heart className="h-5 w-5 text-primary" />}
            <h2 className="text-xl font-semibold">
              {step === 1 ? "Personal Details" : "Health Information"}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Step {step} of 2 — {step === 1 ? "Tell us about yourself" : "Your health background"}
          </p>

          {/* Progress bar */}
          <div className="w-full h-2 bg-secondary rounded-full mb-8 overflow-hidden">
            <motion.div
              className="h-full gradient-primary rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: step === 1 ? "50%" : "100%" }}
              transition={{ duration: 0.4 }}
            />
          </div>

          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Enter your full name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age">Age *</Label>
                  <Input id="age" type="number" value={form.age} onChange={(e) => update("age", e.target.value)} placeholder="25" />
                </div>
                <div>
                  <Label htmlFor="gender">Gender *</Label>
                  <Select value={form.gender} onValueChange={(v) => update("gender", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="you@email.com" />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+91 ..." />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="blood">Blood Group</Label>
                <Select value={form.bloodGroup} onValueChange={(v) => update("bloodGroup", v)}>
                  <SelectTrigger><SelectValue placeholder="Select blood group" /></SelectTrigger>
                  <SelectContent>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                      <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="allergies">Known Allergies</Label>
                <Textarea id="allergies" value={form.allergies} onChange={(e) => update("allergies", e.target.value)} placeholder="e.g., Penicillin, Pollen..." rows={3} />
              </div>
              <div>
                <Label htmlFor="conditions">Existing Conditions</Label>
                <Textarea id="conditions" value={form.existingConditions} onChange={(e) => update("existingConditions", e.target.value)} placeholder="e.g., Diabetes, Eczema..." rows={3} />
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-8">
            {step === 2 && (
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
            )}
            <Button onClick={handleNext} className="flex-1 gradient-primary text-primary-foreground">
              {step === 1 ? "Next" : "Complete Profile"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfileSetup;
