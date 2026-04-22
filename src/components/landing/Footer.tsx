import { Link } from "react-router-dom";
import aktivlyIcon from "@/assets/aktivlySVG.svg";

const Footer = () => {
  return (
    <footer className="border-t border-border py-16">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src={aktivlyIcon} alt="Aktivly" className="h-6" />
              <span className="text-lg font-bold text-foreground">Aktivly</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Det moderna sättet att planera aktiviteter och hantera deltagare.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Produkt</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Funktioner</Link></li>
              
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Integrationer</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Företag</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Om oss</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Blogg</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Karriär</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Support</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Hjälpcenter</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Kontakt</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Villkor</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© 2026 Aktivly AB. Alla rättigheter förbehållna.</p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Integritetspolicy</a>
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Användarvillkor</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
