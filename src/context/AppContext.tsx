import { createContext, useContext, useState, ReactNode } from "react";

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
  name: "",
  age: "",
  gender: "",
  email: "",
  phone: "",
  bloodGroup: "",
  allergies: "",
  existingConditions: "",
};

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [patient, setPatient] = useState<PatientProfile>(() => {
    const saved = localStorage.getItem("aarogyam_patient");
    return saved ? JSON.parse(saved) : defaultPatient;
  });

  const [reports, setReports] = useState<ConsultationReport[]>(() => {
    const saved = localStorage.getItem("aarogyam_reports");
    return saved ? JSON.parse(saved) : [];
  });

  const handleSetPatient = (p: PatientProfile) => {
    setPatient(p);
    localStorage.setItem("aarogyam_patient", JSON.stringify(p));
  };

  const addReport = (r: ConsultationReport) => {
    const updated = [r, ...reports];
    setReports(updated);
    localStorage.setItem("aarogyam_reports", JSON.stringify(updated));
  };

  const isProfileComplete = Boolean(patient.name && patient.age && patient.gender);

  return (
    <AppContext.Provider value={{ patient, setPatient: handleSetPatient, reports, addReport, isProfileComplete }}>
      {children}
    </AppContext.Provider>
  );
};
