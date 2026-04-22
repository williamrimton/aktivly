const SocialProof = () => {
  return (
    <section className="py-16 border-b border-border/50">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          {[
            { stat: "Gratis", label: "Att komma igång" },
            { stat: "< 60s", label: "Att skapa en aktivitet" },
            { stat: "24/7", label: "Tillgängligt dygnet runt" },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <p className="text-2xl lg:text-3xl font-bold text-foreground">{item.stat}</p>
              <p className="text-sm text-muted-foreground mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
