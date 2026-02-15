import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";

// Import all DermSight pages
import Index from "./pages/Index";
import Login from "./pages/Login"; 
import ProfileSetup from "./pages/ProfileSetup";
import Dashboard from "./pages/Dashboard";
import Consultation from "./pages/Consultation";
import Quiz from "./pages/Quiz";
import History from "./pages/History";
import MapPage from "./pages/MapPage";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/**
 * PROTECTED ROUTE
 * Redirects to /login if the user is not authenticated.
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // Updated key to reflect DermSight branding
  const isAuthenticated = localStorage.getItem("dermsights_patient");
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

/**
 * PUBLIC ROUTE
 * Redirects to /dashboard if the user is already logged in.
 */
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem("dermsights_patient");
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
{/* --- AUTHENTICATION ENTRANCE --- */}
<Route 
  path="/" 
  element={
    <PublicRoute>
      <Login />
    </PublicRoute>
  } 
/>
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />

            {/* --- PROTECTED CLINICAL ROUTES --- */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/profile-setup" 
              element={
                <ProtectedRoute>
                  <ProfileSetup />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/consultation" 
              element={
                <ProtectedRoute>
                  <Consultation />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/quiz" 
              element={
                <ProtectedRoute>
                  <Quiz />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/history" 
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/map" 
              element={
                <ProtectedRoute>
                  <MapPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } 
            />

            {/* --- MISC & FALLBACK --- */}
            <Route path="/welcome" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;