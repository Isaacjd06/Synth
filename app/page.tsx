import HeroSection from "@/components/marketing/HeroSection";
import WhatIsSynthSection from "@/components/marketing/WhatIsSynthSection";
import WhyDifferentSection from "@/components/marketing/WhyDifferentSection";
import ICPSection from "@/components/marketing/ICPSection";
import ExampleAutomationsSection from "@/components/marketing/ExampleAutomationsSection";
import HowItWorksSection from "@/components/marketing/HowItWorksSection";
import FooterSection from "@/components/marketing/FooterSection";
import BackgroundEffects from "@/components/marketing/BackgroundEffects";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <BackgroundEffects />
      <HeroSection />
      <WhatIsSynthSection />
      <WhyDifferentSection />
      <ICPSection />
      <ExampleAutomationsSection />
      <HowItWorksSection />
      <FooterSection />
    </main>
  );
}
