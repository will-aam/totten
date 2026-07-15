import Navbar from "./components/navbar";
import Hero from "./components/hero";
import Features from "./components/features";
import AgendaSection from "./components/agenda";
import TotemSection from "./components/totem";
import PricingSection from "./components/pricing";
import FAQSection from "./components/faq";
import DemoRequestSection from "./components/demo-request";
import FinalCTA from "./components/final-cta";
import Footer from "./components/footer";

export default function LandingPage() {
  return (
    <div className="bg-app min-h-screen text-foreground antialiased">
      <Navbar />
      <Hero />
      <Features />
      <AgendaSection />
      <TotemSection />
      <PricingSection />
      <FAQSection />
      <DemoRequestSection />
      <FinalCTA />
      <Footer />
      {/* <LogosStrip />
        <DashboardShowcase />
        <TimelineSection />
        <PWASection />
        <MetricsSection />
        <Testimonials /> */}
    </div>
  );
}
