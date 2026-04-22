import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const FinalCTA = () => {
  return (
    <section className="py-24 lg:py-32">
      <div className="container">
        <div className="relative rounded-3xl gradient-primary p-12 lg:p-20 text-center overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl lg:text-4xl font-bold text-primary-foreground">
              Redo att modernisera din aktivitetshantering?
            </h2>
            <p className="text-primary-foreground/80 text-lg">
              Skapa din första aktivitet på under en minut. Helt gratis att komma igång.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" variant="secondary" className="h-12 px-6 text-base font-semibold" asChild>
                <Link to="/signup">
                  Kom igång gratis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
