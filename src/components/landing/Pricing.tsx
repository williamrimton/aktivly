import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Gratis",
    price: "0 kr",
    period: "/månad",
    description: "Perfekt för att komma igång",
    features: [
      "Upp till 3 aktiviteter",
      "10 deltagare per aktivitet",
      "Grundläggande deltagarhantering",
      "E-postinbjudningar",
    ],
    cta: "Kom igång gratis",
    popular: false,
  },
  {
    name: "Pro",
    price: "199 kr",
    period: "/månad",
    description: "För aktiva organisatörer",
    features: [
      "Obegränsade aktiviteter",
      "100 deltagare per aktivitet",
      "Väntelista & påminnelser",
      "SMS-inbjudningar",
      "Exportera deltagarlistor",
      "Prioriterad support",
    ],
    cta: "Starta Pro",
    popular: true,
  },
  {
    name: "Företag",
    price: "499 kr",
    period: "/månad",
    description: "För stora organisationer",
    features: [
      "Allt i Pro",
      "Obegränsade deltagare",
      "Flera administratörer",
      "API-åtkomst",
      "SSO-inloggning",
      "Dedikerad kontaktperson",
    ],
    cta: "Kontakta oss",
    popular: false,
  },
];

const Pricing = () => {
  return (
    <section id="pricing" className="py-24 lg:py-32">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-medium text-primary mb-3">Priser</p>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Enkel och transparent prissättning
          </h2>
          <p className="text-muted-foreground text-lg">
            Börja gratis. Uppgradera när du behöver.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-6 space-y-6 transition-all ${
                plan.popular
                  ? "border-primary shadow-card bg-card scale-[1.02]"
                  : "border-border bg-card hover:shadow-card"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="gradient-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                    Populärast
                  </span>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>

              <ul className="space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full ${plan.popular ? "gradient-primary text-primary-foreground border-0" : ""}`}
                variant={plan.popular ? "default" : "outline"}
                asChild
              >
                <Link to="/signup">{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
