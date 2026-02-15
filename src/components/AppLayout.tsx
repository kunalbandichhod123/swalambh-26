import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, History, MapPin, User } from "lucide-react";

const navItems = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/history", icon: History, label: "History" },
  { path: "/map", icon: MapPin, label: "Map" },
  { path: "/profile", icon: User, label: "Profile" },
];

const Header = ({ patientName }: { patientName?: string }) => (
  /* REMOVED: sticky, top-0, z-50, and the background. 
     ADDED: pt-10 (padding top) to give it nice breathing room at the top of the page. */
  <header className="w-full flex items-center justify-center px-6 pt-10 pb-4 bg-transparent relative">
    
    <Link to="/dashboard" className="flex items-center justify-center">
      <span className="text-5xl font-extrabold text-primary drop-shadow-sm">Aarogyam</span>
    </Link>

    {patientName && (
      /* Adjusted the alignment so it stays perfectly centered with the big text */
      <span className="absolute right-6 top-1/2 -translate-y-1/2 text-sm text-muted-foreground hidden sm:block mt-2">
        Patient Portal: <span className="font-semibold text-foreground">{patientName}</span>
      </span>
    )}
  </header>
);

const BottomNav = () => {
  const location = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-md border-t border-border/50">
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
    <div className="min-h-screen bg-transparent">
      <Header patientName={patientName} />
      <main className="pb-20">{children}</main>
      <BottomNav />
    </div>
  );
};