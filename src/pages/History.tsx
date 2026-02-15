import { useAppContext } from "@/context/AppContext";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { FileDown, Mail, Trash2 } from "lucide-react";
import jsPDF from "jspdf";
import html2pdf from 'html2pdf.js';
import ReactMarkdown from 'react-markdown';
const History = () => {
  const { reports, patient } = useAppContext();

  // FIX 1: Pass the specific report.id so it knows exactly WHICH report to download
  
  const downloadPDF = (reportId: string) => {
    // FIX 2: Target the unique ID of the specific report wrapper
    const element = document.getElementById(`report-${reportId}`);
    
    if (!element) return;

    const opt = {
      margin:       0.5,
      filename:     `DermSight_Report_${reportId}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true }, // Crucial: useCORS allows the image to render in the PDF
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="gradient-primary text-primary-foreground rounded-2xl p-4 mb-6 text-center">
          <h1 className="text-xl font-bold">Report Download</h1>
        </div>

        <h2 className="text-2xl font-bold text-center mb-6">Your Health Report Summary</h2>

        {reports.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <p className="text-muted-foreground">No reports yet. Start a consultation to generate your first report.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {reports.map((report, i) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-2xl p-6"
              >
                {/* FIX 3: Add the dynamic ID here. Notice we only wrap the data, NOT the buttons below, so the buttons don't show up in the PDF */}
                <div id={`report-${report.id}`} className="bg-card rounded-xl p-6 border border-border bg-white">
                  
                  {/* Patient Details */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-[#2A5C43]">Patient Details:</h3>
                      <p className="text-sm font-medium">{patient.name || "Guest Patient"}</p>
                      {patient.age && <p className="text-sm">Age: {patient.age}</p>}
                      {patient.gender && <p className="text-sm capitalize">{patient.gender}</p>}
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">Date: {report.date}</p>
                  </div>

                  {/* Consultation Summary */}
                  <div className="border-t border-border pt-4 mb-4">
                    <h4 className="font-bold mb-2 text-[#2A5C43]">Consultation Summary:</h4>
                    <p className="text-sm mb-1"><strong>Selected Area:</strong> {report.selectedArea}</p>
                    <p className="text-sm mb-4"><strong>Reported Symptoms:</strong> {report.symptoms.join(", ")}</p>
                    
                    {/* FIX 4: Render the uploaded photo if it exists */}
                    {report.imageUrl && (
                      <div className="mt-3 mb-4">
                        <p className="text-sm font-bold mb-2">Clinical Image Provided:</p>
                        <img 
                          src={report.imageUrl} 
                          alt="Patient Symptom" 
                          className="max-h-56 rounded-lg object-cover border border-gray-200 shadow-sm"
                          crossOrigin="anonymous" 
                        />
                      </div>
                    )}
                  </div>

                  {/* AI Analysis section */}
                  <div className="border-t border-border pt-4 mb-4">
                    <h4 className="font-bold mb-3 text-[#2A5C43]">AI Clinical Assessment:</h4>
                    
                    {/* Because we saved the full text block in "remedies" in Consultation.tsx, we render it nicely here */}
                    {report.aiAnalysis.remedies && report.aiAnalysis.remedies.length > 0 ? (
                       <div className="text-sm whitespace-pre-wrap leading-relaxed text-gray-800 bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                         {report.aiAnalysis.remedies.join("\n")}
                       </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No detailed analysis available for this report.</p>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground italic mt-6 border-t border-border pt-3">
                    Disclaimer: This is an AI-generated preliminary report and not a substitute for professional medical advice. Please consult a certified doctor for an accurate diagnosis.
                  </p>
                </div>

                {/* Action Buttons (Outside the PDF area) */}
                <div className="flex flex-col items-center gap-3 mt-6">
                  {/* FIX 5: Pass the specific report ID to the function */}
                  <Button onClick={() => downloadPDF(report.id)} className="w-full max-w-xs bg-[#2A5C43] text-white hover:bg-[#1e4230]">
                    <FileDown className="h-4 w-4 mr-2" /> Download Report as PDF
                  </Button>
                  <Button variant="outline" className="w-full max-w-xs border-[#2A5C43] text-[#2A5C43] hover:bg-gray-50">
                    <Mail className="h-4 w-4 mr-2" /> Email Report to Doctor
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  All reports are securely stored in your history.
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default History;