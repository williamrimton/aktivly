import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Är Aktivly verkligen gratis att börja med?",
    a: "Ja! Vårt gratispaket inkluderar upp till 3 aktiviteter med 10 deltagare per aktivitet. Perfekt för att testa plattformen.",
  },
  {
    q: "Hur lång tid tar det att komma igång?",
    a: "Du kan skapa ditt konto och din första aktivitet på under 2 minuter. Ingen installation eller konfiguration krävs.",
  },
  {
    q: "Kan deltagare svara utan att ha ett konto?",
    a: "Absolut! Deltagare behöver inte skapa något konto. De klickar bara på länken i inbjudan och svarar direkt.",
  },
  {
    q: "Fungerar det för stora organisationer?",
    a: "Ja, vårt Företagspaket stödjer obegränsade deltagare, flera administratörer och API-åtkomst för att integrera med era befintliga system.",
  },
  {
    q: "Hur fungerar väntelistan?",
    a: "När en aktivitet är fullbokad hamnar nya anmälningar automatiskt på väntelistan. Vid avbokning flyttas nästa person upp automatiskt och får en notifikation.",
  },
  {
    q: "Kan jag exportera deltagarlistor?",
    a: "Ja, med Pro-paketet kan du exportera deltagarlistor som CSV eller Excel-fil.",
  },
];

const FAQ = () => {
  return (
    <section id="faq" className="py-24 lg:py-32 bg-surface">
      <div className="container max-w-3xl">
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-primary mb-3">FAQ</p>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Vanliga frågor
          </h2>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="bg-card border border-border rounded-xl px-6 data-[state=open]:shadow-soft"
            >
              <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-4">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground pb-4">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;
