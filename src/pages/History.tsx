import { useAppContext } from "@/context/AppContext";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { FileDown, Mail, Trash2 } from "lucide-react";
import jsPDF from "jspdf";

const History = () => {
  const { reports, patient } = useAppContext();

  const downloadPDF = (report: typeof reports[0]) => {
    const doc = new jsPDF();
    const margin = 20;
    let y = margin;

    doc.setFontSize(20);
    doc.setTextColor(34, 87, 52);
    doc.text("Aarogyam - Health Report", margin, y);
    y += 12;

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Date: ${report.date}`, 140, margin);

    doc.setDrawColor(34, 87, 52);
    doc.line(margin, y, 190, y);
    y += 10;

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Patient Details:", margin, y);
    y += 7;
    doc.setFontSize(10);
    doc.text(`Name: ${patient.name}`, margin, y); y += 5;
    doc.text(`Age: ${patient.age} | Gender: ${patient.gender}`, margin, y); y += 10;

    doc.setFontSize(12);
    doc.text("Consultation Summary:", margin, y); y += 7;
    doc.setFontSize(10);
    doc.text(`Selected Area: ${report.selectedArea}`, margin, y); y += 5;
    doc.text(`Reported Symptoms: ${report.symptoms.join(", ")}`, margin, y); y += 10;

    doc.setFontSize(12);
    doc.text("AI Analysis & Preliminary Prescription:", margin, y); y += 8;
    doc.setFontSize(10);

    report.aiAnalysis.conditions.forEach((c) => {
      doc.text(`• ${c.probability}% - ${c.name}: ${c.symptoms.join(", ")}`, margin + 5, y);
      y += 6;
    });
    y += 4;

    doc.text("What to Avoid:", margin, y); y += 6;
    report.aiAnalysis.whatToAvoid.forEach((item) => {
      doc.text(`  • ${item}`, margin, y); y += 5;
    });
    y += 4;

    doc.text("Medical Care & Home Remedies:", margin, y); y += 6;
    report.aiAnalysis.remedies.forEach((item) => {
      doc.text(`  • ${item}`, margin, y); y += 5;
    });
    y += 8;

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Disclaimer: This is an AI-generated preliminary report and not a substitute for professional medical advice.", margin, y);

    doc.save(`Aarogyam_Report_${report.date.replace(/\s/g, "_")}.pdf`);
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
                <div className="bg-card rounded-xl p-5 border border-border">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold">Patient Details:</h3>
                      <p className="text-sm">{patient.name}</p>
                      <p className="text-sm">Age: {patient.age}</p>
                      <p className="text-sm capitalize">{patient.gender}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">Date: {report.date}</p>
                  </div>

                  <div className="border-t border-border pt-4 mb-4">
                    <h4 className="font-bold mb-2">Consultation Summary:</h4>
                    <p className="text-sm"><strong>Selected Area:</strong> {report.selectedArea}</p>
                    <p className="text-sm"><strong>Reported Symptoms:</strong> {report.symptoms.join(", ")}</p>
                  </div>

                  <div className="border-t border-border pt-4 mb-4">
                    <h4 className="font-bold mb-2">AI Analysis & Preliminary Prescription:</h4>
                    {report.aiAnalysis.conditions.map((c) => (
                      <p key={c.name} className="text-sm">
                        • <strong>{c.probability}%</strong> - {c.name}: {c.symptoms.join(", ")}
                      </p>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 mb-4">
                    <div>
                      <h5 className="font-semibold text-sm mb-1">What to Avoid:</h5>
                      <ul className="text-sm space-y-0.5">
                        {report.aiAnalysis.whatToAvoid.map((a) => <li key={a}>• {a}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-semibold text-sm mb-1">Remedies:</h5>
                      <ul className="text-sm space-y-0.5">
                        {report.aiAnalysis.remedies.map((r) => <li key={r}>• {r}</li>)}
                      </ul>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground italic">
                    Disclaimer: This is an AI-generated preliminary report and not a substitute for professional medical advice.
                  </p>
                </div>

                <div className="flex flex-col items-center gap-3 mt-4">
                  <Button onClick={() => downloadPDF(report)} className="w-full max-w-xs gradient-primary text-primary-foreground">
                    <FileDown className="h-4 w-4 mr-2" /> Download Report as PDF
                  </Button>
                  <Button variant="outline" className="w-full max-w-xs">
                    <Mail className="h-4 w-4 mr-2" /> Email Report to Doctor
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center mt-3">
                  All reports are encrypted for your privacy.
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
