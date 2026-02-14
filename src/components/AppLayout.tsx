import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, History, MapPin, User } from "lucide-react";
import logo from "@/assets/logo.png";

const navItems = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/history", icon: History, label: "History" },
  { path: "/map", icon: MapPin, label: "Map" },
  { path: "/profile", icon: User, label: "Profile" },
];

const Header = ({ patientName }: { patientName?: string }) => (
  <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 bg-card/80 backdrop-blur-md border-b border-border">
    <Link to="/dashboard" className="flex items-center gap-2">
      <img src={logo} alt="Aarogyam" className="h-9 w-9 rounded-lg" />
      <span className="text-xl font-bold text-primary">Aarogyam</span>
    </Link>
    {patientName && (
      <span className="text-sm text-muted-foreground">
        Patient Portal: <span className="font-semibold text-foreground">{patientName}</span>
      </span>
    )}
  </header>
);

const BottomNav = () => {
  const location = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-md border-t border-border">
      <div className="flex items-center justify-around py-2 max-w-lg mx-auto">
        {navItems.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  let patientName = "";
  try {
    const saved = localStorage.getItem("aarogyam_patient");
    if (saved) patientName = JSON.parse(saved).name;
  } catch {}

  return (
    <div className="min-h-screen bg-background">
      <Header patientName={patientName} />
      <main className="pb-20">{children}</main>
      <BottomNav />
    </div>
  );
};
