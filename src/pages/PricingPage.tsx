import Navbar from "@/components/landing/Navbar";
import Pricing from "@/components/landing/Pricing";
import FAQ from "@/components/landing/FAQ";
import Footer from "@/components/landing/Footer";

const PricingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <Pricing />
        <FAQ />
      </div>
      <Footer />
    </div>
  );
};

export default PricingPage;
