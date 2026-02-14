import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Save, User } from "lucide-react";
import { toast } from "sonner";

const ProfilePage = () => {
  const { patient, setPatient } = useAppContext();
  const [form, setForm] = useState(patient);

  const update = (key: keyof typeof form, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  const handleSave = () => {
    setPatient(form);
    toast.success("Profile updated successfully!");
  };

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-14 w-14 rounded-full gradient-primary flex items-center justify-center">
            <User className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{patient.name || "Your Profile"}</h1>
            <p className="text-sm text-muted-foreground">Manage your health profile</p>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6 space-y-4">
          <div>
            <Label>Full Name</Label>
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Age</Label>
              <Input type="number" value={form.age} onChange={(e) => update("age", e.target.value)} />
            </div>
            <div>
              <Label>Gender</Label>
              <Select value={form.gender} onValueChange={(v) => update("gender", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </div>
          <div>
            <Label>Blood Group</Label>
            <Select value={form.bloodGroup} onValueChange={(v) => update("bloodGroup", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                  <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Allergies</Label>
            <Textarea value={form.allergies} onChange={(e) => update("allergies", e.target.value)} rows={2} />
          </div>
          <div>
            <Label>Existing Conditions</Label>
            <Textarea value={form.existingConditions} onChange={(e) => update("existingConditions", e.target.value)} rows={2} />
          </div>

          <Button onClick={handleSave} className="w-full gradient-primary text-primary-foreground">
            <Save className="h-4 w-4 mr-2" /> Save Profile
          </Button>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default ProfilePage;
