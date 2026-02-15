import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to Aarogyam</h1>
      <p className="text-muted-foreground mb-8 text-lg max-w-md">
        Your holistic journey to wellness begins here.
      </p>
      <div className="flex gap-4">
        <Button asChild size="lg" className="rounded-full px-8">
          <Link to="/login">Get Started</Link>
        </Button>
      </div>
    </div>
  );
};

export default Index;
