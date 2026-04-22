import { CalendarPlus, Send, Users, Clock, Bell, Smartphone } from "lucide-react";

const features = [
  {
    icon: CalendarPlus,
    title: "Skapa aktiviteter snabbt",
    description: "Skapa ett nytt event på under 60 sekunder med vår smarta formulärupplevelse.",
  },
  {
    icon: Send,
    title: "Skicka inbjudningar",
    description: "Bjud in deltagare via e-post eller delbar länk med ett klick.",
  },
  {
    icon: Users,
    title: "Hantera deltagarlistor",
    description: "Se vem som tackat ja, nej eller inte svarat — i realtid.",
  },
  {
    icon: Clock,
    title: "Väntelista",
    description: "Automatisk väntelista när platser tar slut. Deltagare flyttas upp vid avbokning.",
  },
  {
    icon: Bell,
    title: "Påminnelser",
    description: "Automatiska påminnelser så att deltagare aldrig missar en aktivitet.",
  },
  {
    icon: Smartphone,
    title: "Mobilvänligt",
    description: "Hela upplevelsen är optimerad för mobilen — för både organisatörer och deltagare.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 lg:py-32">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-medium text-primary mb-3">Funktioner</p>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Allt du behöver för att hantera aktiviteter
          </h2>
          <p className="text-muted-foreground text-lg">
            Ett komplett verktyg som gör det enkelt att organisera, bjuda in och följa upp.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="group p-6 rounded-2xl border border-border bg-card hover:shadow-card hover:border-primary/20 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
