import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const ConfirmEmail = () => (
  <div className="min-h-screen flex gradient-hero">
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8 animate-fade-in text-center">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">A</span>
          </div>
          <span className="font-semibold text-lg text-foreground">Aktivly</span>
        </Link>

        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Bekräfta din e-post</h1>
          <p className="text-muted-foreground">
            Vi har skickat ett bekräftelsemail till dig. Klicka på länken i mailet för att aktivera ditt konto.
          </p>
        </div>

        <Button asChild variant="outline" className="w-full h-11">
          <Link to="/login">Gå till inloggning</Link>
        </Button>
      </div>
    </div>
  </div>
);

export default ConfirmEmail;
