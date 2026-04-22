import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden gradient-hero">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-8 animate-fade-in">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] text-foreground">
              Planera aktiviteter och hantera deltagare{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(4,78%,55%)] via-[hsl(25,100%,50%)] to-[hsl(214,74%,45%)]">
                på några sekunder
              </span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
              Det moderna sättet att skapa event, skicka inbjudningar och hålla koll på deltagare. 
              Perfekt för föreningar, skolor, företag och idrottsklubbar.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" className="gradient-primary text-primary-foreground border-0 shadow-card text-base h-12 px-6" asChild>
                <Link to="/signup">
                  Kom igång gratis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Product Mockup */}
          <div className="relative animate-scale-in" style={{ animationDelay: "0.2s" }}>
            <div className="bg-card rounded-2xl shadow-elevated border border-border p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Kommande aktiviteter</p>
                  <p className="text-2xl font-bold text-foreground">12</p>
                </div>
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                  <span className="text-primary-foreground text-sm">📅</span>
                </div>
              </div>
              
              <div className="space-y-3">
                {[
                  { title: "Träning U15", time: "Idag 18:00", count: "14/16", status: "bg-success" },
                  { title: "Styrelsemöte", time: "Imorgon 19:00", count: "6/8", status: "bg-primary" },
                  { title: "Familjedag", time: "Lördag 10:00", count: "32/40", status: "bg-warning" },
                ].map((event, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border/50 hover:border-border transition-colors">
                    <div className={`w-2 h-2 rounded-full ${event.status}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{event.time}</p>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">{event.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute -top-4 -right-4 bg-card rounded-xl shadow-elevated border border-border p-3 animate-fade-in" style={{ animationDelay: "0.6s" }}>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center">
                  <span className="text-xs">✓</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">Anna bekräftade</p>
                  <p className="text-[10px] text-muted-foreground">Träning U15</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
