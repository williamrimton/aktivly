import { CalendarPlus, Send, BarChart3 } from "lucide-react";

const steps = [
  {
    icon: CalendarPlus,
    step: "01",
    title: "Skapa aktivitet",
    description: "Fyll i datum, tid, plats och antal platser. Klart på under 60 sekunder.",
  },
  {
    icon: Send,
    step: "02",
    title: "Bjud in deltagare",
    description: "Dela länk eller skicka e-post till alla du vill bjuda in.",
  },
  {
    icon: BarChart3,
    step: "03",
    title: "Följ svar i realtid",
    description: "Se vem som tackat ja, nej eller står på väntelistan — live.",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-24 lg:py-32">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-medium text-primary mb-3">Så funkar det</p>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Tre enkla steg
          </h2>
          <p className="text-muted-foreground text-lg">
            Från idé till fullt hanterad aktivitet på några minuter.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, i) => (
            <div key={step.step} className="text-center space-y-4 animate-fade-in" style={{ animationDelay: `${i * 0.15}s` }}>
              <div className="w-16 h-16 rounded-2xl bg-primary/5 mx-auto flex items-center justify-center">
                <step.icon className="h-7 w-7 text-primary" />
              </div>
              <span className="text-xs font-bold text-primary/60 tracking-widest">{step.step}</span>
              <h3 className="text-xl font-semibold text-foreground">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
