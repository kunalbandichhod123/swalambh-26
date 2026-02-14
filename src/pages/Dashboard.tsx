import { Link } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { AppLayout } from "@/components/AppLayout";
import { motion } from "framer-motion";
import { Mic, Camera, FileText, Search, TrendingUp, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

const DashboardCard = ({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className={`glass-card rounded-2xl p-6 ${className}`}
  >
    {children}
  </motion.div>
);

const Dashboard = () => {
  const { patient, reports } = useAppContext();

  const recentReport = reports[0];

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-bold">
            Welcome back, <span className="text-accent">{patient.name || "Patient"}.</span>
          </h1>
          <p className="text-muted-foreground mt-1">Your holistic skin wellness journey continues here.</p>
        </motion.div>

        {/* Main action cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <DashboardCard className="md:col-span-1 gradient-card" delay={0.1}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Mic className="h-6 w-6 text-primary" />
              </div>
              <Camera className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">AI Skin Assistant & Chatbot</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Voice, text & image analysis</p>
            <Link to="/consultation">
              <Button className="w-full gradient-primary text-primary-foreground">Start New Consultation</Button>
            </Link>
          </DashboardCard>

          <DashboardCard delay={0.2}>
            <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Report Download as PDF</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">{reports.length} reports available</p>
            <Link to="/history">
              <Button variant="outline" className="w-full">View Past Reports</Button>
            </Link>
          </DashboardCard>

          <DashboardCard delay={0.3}>
            <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Dermatology Test & Quiz</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Self-assessment tools</p>
            <Link to="/quiz">
              <Button variant="outline" className="w-full">Take Assessment</Button>
            </Link>
          </DashboardCard>
        </div>

        {/* Wellness progress */}
        <DashboardCard className="mt-6" delay={0.4}>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            Track Your Wellness Progress
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-32 bg-secondary/50 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">+15%</p>
                <p className="text-sm text-muted-foreground">Skin Condition Improvement</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <p className="font-semibold">Current Status: <span className="text-success">Stable</span></p>
                <p className="text-sm text-muted-foreground">{reports.length} consultations completed</p>
              </div>
              <Link to="/consultation">
                <Button size="sm" className="gradient-primary text-primary-foreground">View Full Analysis</Button>
              </Link>
            </div>
          </div>
        </DashboardCard>

        {/* Daily reminders */}
        <DashboardCard className="mt-6" delay={0.5}>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-accent" />
            Daily Health Reminders
          </h3>
          <div className="space-y-3">
            {[
              { text: "How are your rashes today? Have they improved?", time: "9:00 AM" },
              { text: "Did you visit the doctor? Update your prescription.", time: "2:00 PM" },
              { text: "Apply moisturizer and sunscreen before going out.", time: "7:00 AM" },
            ].map((r, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                <p className="text-sm">{r.text}</p>
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">{r.time}</span>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
