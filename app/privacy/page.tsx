import Navbar from "@/components/landing/Navbar";
import NewFooterSection from "@/components/landing/NewFooterSection";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen overflow-x-hidden relative" style={{ background: "linear-gradient(180deg, #050505 0%, #0a0a0a 50%, #050505 100%)" }}>
      <Navbar />
      <div className="container mx-auto px-6 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-display-bold text-foreground mb-6">
            Privacy Policy
          </h1>
          <p className="text-lg text-foreground/60 mb-12">
            This is a placeholder page for the Privacy Policy.
          </p>
        </div>
      </div>
      <NewFooterSection />
    </main>
  );
}

