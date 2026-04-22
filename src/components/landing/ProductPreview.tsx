const ProductPreview = () => {
  return (
    <section className="py-24 lg:py-32 bg-surface">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-medium text-primary mb-3">Produkten</p>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Designad för att vara enkel
          </h2>
          <p className="text-muted-foreground text-lg">
            Se hur Aktivly gör det möjligt att hantera allt på ett ställe.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Dashboard Preview */}
          <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-warning/60" />
                <div className="w-3 h-3 rounded-full bg-success/60" />
              </div>
              <span className="text-xs text-muted-foreground ml-2">Dashboard</span>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Aktiva", value: "12" },
                  { label: "Deltagare", value: "186" },
                  { label: "Svarsfrekvens", value: "94%" },
                ].map(s => (
                  <div key={s.label} className="p-3 rounded-xl bg-surface text-center">
                    <p className="text-xl font-bold text-foreground">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {["Fotbollsträning", "Årsmöte", "Teambuilding"].map((e, i) => (
                  <div key={e} className="flex items-center justify-between p-3 rounded-xl bg-surface">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-success' : i === 1 ? 'bg-primary' : 'bg-warning'}`} />
                      <span className="text-sm font-medium text-foreground">{e}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{`${8 + i * 4}/${12 + i * 4}`}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RSVP Preview */}
          <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-warning/60" />
                <div className="w-3 h-3 rounded-full bg-success/60" />
              </div>
              <span className="text-xs text-muted-foreground ml-2">Deltagarvy</span>
            </div>
            <div className="p-6 space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-xl gradient-primary mx-auto flex items-center justify-center text-primary-foreground text-lg">⚽</div>
                <h3 className="text-lg font-semibold text-foreground">Fotbollsträning</h3>
                <p className="text-sm text-muted-foreground">Onsdag 18:00 · Eriksdalshallen</p>
              </div>
              <div className="flex gap-3">
                <button className="flex-1 py-3 rounded-xl bg-success text-success-foreground font-medium text-sm">✓ Jag kommer</button>
                <button className="flex-1 py-3 rounded-xl bg-destructive/10 text-destructive font-medium text-sm">✗ Kan inte</button>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Bekräftade (8/12)</p>
                <div className="flex flex-wrap gap-2">
                  {["Erik S.", "Anna L.", "Johan K.", "Maria P.", "Lars G.", "Sofia B.", "Oskar N.", "Elin H."].map(name => (
                    <span key={name} className="text-xs bg-surface px-2 py-1 rounded-md text-foreground">{name}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductPreview;
