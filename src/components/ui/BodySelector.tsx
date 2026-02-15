import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// --- POINT DEFINITIONS ---
const frontPoints = [
  { id: "head-front", label: "Head & Face", x: 50, y: 9 },
  { id: "neck-front", label: "Neck", x: 50, y: 19 },
  { id: "right-shoulder", label: "Right Shoulder", x: 33, y: 24 }, 
  { id: "left-shoulder", label: "Left Shoulder", x: 67, y: 24 },
  { id: "chest", label: "Chest", x: 50, y: 32 },
  { id: "stomach", label: "Stomach & Abdomen", x: 50, y: 42 },
  { id: "right-arm", label: "Right Arm", x: 33, y: 40 },
  { id: "left-arm", label: "Left Arm", x: 67, y: 40 },
  { id: "right-hand", label: "Right Hand", x: 33, y: 58 },
  { id: "left-hand", label: "Left Hand", x: 67, y: 58 },
  { id: "pelvis", label: "Pelvis", x: 50, y: 50 },
  { id: "right-thigh", label: "Right Thigh", x: 41, y: 63 },
  { id: "left-thigh", label: "Left Thigh", x: 60, y: 63 },
  { id: "right-knee", label: "Right Knee", x: 41, y: 73 },
  { id: "left-knee", label: "Left Knee", x: 60, y: 73 },
  { id: "right-foot", label: "Right Foot", x: 39, y: 95 },
  { id: "left-foot", label: "Left Foot", x: 62, y: 95 },
];

const backPoints = [
  { id: "head-back", label: "Back of Head", x: 50, y: 9 },
  { id: "neck-back", label: "Nape (Back of Neck)", x: 50, y: 19 },
  { id: "upper-back", label: "Upper Back", x: 50, y: 30 },
  { id: "lower-back", label: "Lower Back", x: 50, y: 45 },
  { id: "left-shoulder-back", label: "Left Shoulder (Back)", x: 67, y: 24 },
  { id: "right-shoulder-back", label: "Right Shoulder (Back)", x: 33, y: 24 },
  { id: "left-glute", label: "Left Glute", x: 59, y: 55 },
  { id: "right-glute", label: "Right Glute", x: 43, y: 55 },
  { id: "left-hamstring", label: "Left Hamstring", x: 58, y: 68 },
  { id: "right-hamstring", label: "Right Hamstring", x: 43, y: 68 },
  { id: "left-calf", label: "Left Calf", x: 60, y: 82 },
  { id: "right-calf", label: "Right Calf", x: 42, y: 82 },
  { id: "left-heel", label: "Left Heel", x: 58, y: 95 },
  { id: "right-heel", label: "Right Heel", x: 42, y: 95 },
];

interface BodySelectorProps {
  // CHANGED: Now accepts an array of strings for multiple selections
  selectedParts?: string[]; 
  // CHANGED: Uses the new toggle function passed from Consultation.tsx
  onPartsToggle?: (parts: string[]) => void; 
}

export const BodySelector = ({ selectedParts = [], onPartsToggle }: BodySelectorProps) => {
  const [view, setView] = useState<"front" | "back">("front");

  const toggleView = () => {
    setView((prev) => (prev === "front" ? "back" : "front"));
  };

  // NEW: Logic to add or remove points from the selection array
  const handlePointClick = (label: string) => {
    if (!onPartsToggle) return;
    
    if (selectedParts.includes(label)) {
      // If already clicked, remove it from the array
      onPartsToggle(selectedParts.filter((p) => p !== label));
    } else {
      // If not clicked, add it to the array
      onPartsToggle([...selectedParts, label]);
    }
  };

  const currentPoints = view === "front" ? frontPoints : backPoints;
  const imageSrc = view === "front" ? "/body-model-front.png" : "/body-model-back.png";

  return (
    <div className="flex flex-col items-center w-full h-full">
      
      {/* View Toggle Controls */}
      <div className="flex items-center justify-between w-full mb-4 bg-white py-2 px-4 rounded-full shadow-sm border border-gray-200 flex-shrink-0">
        <Button variant="ghost" size="icon" onClick={toggleView} className="h-8 w-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
          <ChevronLeft className="h-5 w-5 text-gray-700" />
        </Button>
        <span className="font-bold text-[#2A5C43] uppercase tracking-widest text-sm">{view} VIEW</span>
        <Button variant="ghost" size="icon" onClick={toggleView} className="h-8 w-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
          <ChevronRight className="h-5 w-5 text-gray-700" />
        </Button>
      </div>

      {/* Body Image & Points */}
      <div className="relative w-full flex-shrink-0 bg-[#E5E5E5] rounded-2xl shadow-inner border border-gray-200 max-h-[55vh] overflow-y-auto custom-scrollbar">
        <div className="relative w-full h-max">
          <img src={imageSrc} alt={`Human body ${view} view`} className="w-full h-auto block opacity-95 pointer-events-none" />
          
          <div className="absolute inset-0">
            {currentPoints.map((point) => {
              // Check if this specific point is currently selected in our array
              const isSelected = selectedParts.includes(point.label);
              
              return (
                <button
                  key={point.id}
                  onClick={() => handlePointClick(point.label)}
                  className={`absolute w-8 h-8 -ml-4 -mt-4 rounded-full transition-all duration-300 flex items-center justify-center group z-10 ${
                    isSelected 
                      ? "bg-[#D97706] scale-125 shadow-[0_0_15px_rgba(217,119,6,0.6)]" // Amber highlight for selected
                      : "bg-white/50 hover:bg-white/80 hover:scale-110 shadow-sm" 
                  }`}
                  style={{ left: `${point.x}%`, top: `${point.y}%` }}
                  title={point.label}
                >
                  <span className={`block rounded-full ${isSelected ? "w-3 h-3 bg-white" : "w-2 h-2 bg-white"}`} />
                  <span className="absolute left-10 px-2 py-1 bg-gray-800 text-white text-[11px] font-medium rounded shadow-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-20">
                    {point.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};