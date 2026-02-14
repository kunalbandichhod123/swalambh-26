import { AppLayout } from "@/components/AppLayout";
import { MapPin, Phone, Clock, Star } from "lucide-react";
import { motion } from "framer-motion";

const hospitals = [
  { name: "City Dermatology Clinic", distance: "2.3 km", rating: 4.8, phone: "+91 98765 43210", hours: "9 AM - 6 PM" },
  { name: "Skin Care Hospital", distance: "5.1 km", rating: 4.5, phone: "+91 91234 56789", hours: "8 AM - 8 PM" },
  { name: "Advanced Derma Center", distance: "8.7 km", rating: 4.6, phone: "+91 87654 32100", hours: "10 AM - 7 PM" },
  { name: "National Skin Institute", distance: "12.4 km", rating: 4.9, phone: "+91 76543 21098", hours: "9 AM - 5 PM" },
  { name: "Wellness Skin Clinic", distance: "15.2 km", rating: 4.3, phone: "+91 65432 10987", hours: "8 AM - 9 PM" },
  { name: "Premier Dermatology", distance: "18.9 km", rating: 4.7, phone: "+91 54321 09876", hours: "9 AM - 6 PM" },
];

const MapPage = () => (
  <AppLayout>
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Nearby Dermatology Care</h1>
      <p className="text-muted-foreground mb-6">Hospitals & clinics within 20 km of your location</p>

      {/* Map placeholder */}
      <div className="glass-card rounded-2xl overflow-hidden mb-6">
        <div className="h-64 bg-secondary flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-12 w-12 mx-auto text-primary mb-2" />
            <p className="text-muted-foreground">Interactive map will load here</p>
            <p className="text-xs text-muted-foreground mt-1">Enable location services for accurate results</p>
          </div>
        </div>
      </div>

      {/* Hospital list */}
      <div className="space-y-3">
        {hospitals.map((h, i) => (
          <motion.div
            key={h.name}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card rounded-xl p-4 flex items-center justify-between"
          >
            <div className="flex-1">
              <h3 className="font-semibold">{h.name}</h3>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {h.distance}</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {h.hours}</span>
                <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {h.phone}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-primary/10 px-3 py-1 rounded-full">
              <Star className="h-3.5 w-3.5 text-accent fill-accent" />
              <span className="text-sm font-medium">{h.rating}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </AppLayout>
);

export default MapPage;
