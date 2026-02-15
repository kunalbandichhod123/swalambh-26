import { createContext, useContext, useState, useEffect, ReactNode } from "react";
// Import your Supabase connection
import { supabase } from "@/lib/supabase";

export interface PatientProfile {
  name: string;
  age: string;
  gender: string;
  email: string;
  phone: string;
  bloodGroup: string;
  allergies: string;
  existingConditions: string;
}

export interface ConsultationReport {
  id: string;
  date: string;
  selectedArea: string;
  symptoms: string[];
  imageUrl?: string;
  aiAnalysis: {
    conditions: { name: string; probability: number; symptoms: string[] }[];
    whatToAvoid: string[];
    remedies: string[];
  };
}

interface AppContextType {
  patient: PatientProfile;
  setPatient: (p: PatientProfile) => void;
  reports: ConsultationReport[];
  addReport: (r: ConsultationReport) => void;
  isProfileComplete: boolean;
}

const defaultPatient: PatientProfile = {
  name: "", age: "", gender: "", email: "", phone: "", bloodGroup: "", allergies: "", existingConditions: "",
};

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  // Keep Patient Profile in local storage for now to keep things fast
  const [patient, setPatient] = useState<PatientProfile>(() => {
    const saved = localStorage.getItem("dermsights_patient");
    return saved ? JSON.parse(saved) : defaultPatient;
  });

  // Start with an empty array, we will fill it from Supabase
  const [reports, setReports] = useState<ConsultationReport[]>([]);

  // --- NEW: FETCH REPORTS FROM SUPABASE ON LOAD ---
  useEffect(() => {
    const fetchReports = async () => {
      const { data, error } = await supabase
        .from("patient_reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase Fetch Error:", error);
        return;
      }

      if (data) {
        // Format the database rows back into our React interface
        const formattedReports: ConsultationReport[] = data.map((row) => ({
          id: row.id,
          date: new Date(row.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
          selectedArea: row.selected_areas || "General",
          symptoms: row.symptoms ? row.symptoms.split(", ") : [],
          imageUrl: row.image_url || undefined,
          aiAnalysis: row.ai_response ? JSON.parse(row.ai_response) : { conditions: [], whatToAvoid: [], remedies: [] },
        }));
        setReports(formattedReports);
      }
    };

    fetchReports();
  }, []);

  const handleSetPatient = (p: PatientProfile) => {
    setPatient(p);
    localStorage.setItem("dermsights_patient", JSON.stringify(p));
  };

  // --- NEW: SAVE REPORT TO SUPABASE ---
  const addReport = async (r: ConsultationReport) => {
    // 1. Instantly update the UI so it feels fast
    const updated = [r, ...reports];
    setReports(updated);

    // 2. Save it silently to the Supabase Cloud
    const { error } = await supabase
      .from("patient_reports")
      .insert([
        {
          patient_name: patient.name || "Guest Patient",
          selected_areas: r.selectedArea,
          symptoms: r.symptoms.join(", "),
          ai_response: JSON.stringify(r.aiAnalysis), // Save the complex AI data as JSON text
          image_url: r.imageUrl || null,
        }
      ]);

    if (error) {
      console.error("Supabase Save Error:", error.message);
      alert("Warning: Failed to save report to the cloud database.");
    }
  };

  const isProfileComplete = Boolean(patient.name && patient.age && patient.gender);

  return (
    <AppContext.Provider value={{ patient, setPatient: handleSetPatient, reports, addReport, isProfileComplete }}>
      {children}
    </AppContext.Provider>
  );
};