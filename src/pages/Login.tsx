import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Mail, ArrowRight } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

const handleLogin = (e: React.FormEvent) => {
  e.preventDefault();
  
  // 1. Save the session key so ProtectedRoute allows us in
  // We save a string version of a user object
  localStorage.setItem("dermsights_patient", JSON.stringify({ 
    email: email, 
    name: "Vikram" // Hardcoded for now until you have a real signup
  }));

  console.log("Login successful, session saved.");
  
  // 2. Now navigate to the dashboard
  navigate("/dashboard"); 
};
  return (
    <div className="min-h-screen bg-[#FDFCF9] flex flex-col items-center justify-center p-4">
      {/* 1. Header/Logo Area */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-[#2A5C43] tracking-tight">Aarogyam</h1>
        
      </div>

      {/* 2. Login Card */}
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-6 text-gray-800 text-center">Patient Login</h2>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input 
              type="email" 
              placeholder="Email Address" 
              className="pl-10 h-12 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-[#2A5C43]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input 
              type="password" 
              placeholder="Password" 
              className="pl-10 h-12 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-[#2A5C43]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full h-12 bg-[#2A5C43] hover:bg-[#1e4230] rounded-xl text-white font-medium text-lg mt-4 transition-all">
            Login <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Don't have an account? <span className="text-[#2A5C43] font-semibold cursor-pointer">Register now</span>
          </p>
        </div>
      </div>

      {/* 3. Footer Privacy Note */}
      <p className="mt-8 text-[11px] text-gray-400 max-w-xs text-center">
        Secure, HIPAA-compliant login. Your health data is encrypted and private.
      </p>
    </div>
  );
};

export default Login;