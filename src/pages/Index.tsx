import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem("aarogyam_patient");
    if (saved) {
      const patient = JSON.parse(saved);
      if (patient.name && patient.age && patient.gender) {
        navigate("/dashboard");
        return;
      }
    }
    navigate("/profile-setup");
  }, [navigate]);

  return null;
};

export default Index;
