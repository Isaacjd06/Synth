"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Sparkles, Twitter, Linkedin, Github } from "lucide-react";
import GoogleSignInButton from "./GoogleSignInButton";

const footerLinks = {
  product: [
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "#pricing" },
    { name: "Integrations", href: "#partners" },
    { name: "Changelog", href: "#" },
  ],
  resources: [
    { name: "Documentation", href: "#" },
    { name: "API Reference", href: "#" },
    { name: "Templates", href: "#" },
    { name: "Blog", href: "#" },
  ],
  company: [
    { name: "About", href: "#about" },
    { name: "Careers", href: "#" },
    { name: "Contact", href: "#contact" },
    { name: "Press Kit", href: "#" },
  ],
  support: [
    { name: "Help Center", href: "#" },
    { name: "Status", href: "#" },
    { name: "Security", href: "#" },
    { name: "Privacy", href: "#" },
  ],
};

const NewFooterSection = () => {
  return (
    <footer className="relative overflow-hidden">
      {/* Curved top transition */}
      <div className="absolute top-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" className="w-full" preserveAspectRatio="none">
          <path
            d="M0,0 Q720,80 1440,0 L1440,80 L0,80 Z"
            fill="#0f0f0f"
          />
        </svg>
      </div>

      <div className="bg-[#0f0f0f] pt-20 pb-8">
        <div className="container px-6">
          {/* Main Footer Content */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 pb-12 border-b border-white/5">
            {/* Logo Column */}
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xl font-display-bold text-foreground">Synth</span>
              </Link>
              <p className="text-sm text-foreground/40 mb-6 max-w-xs">
                The AI automation brain that understands your business and builds workflows automatically.
              </p>

              {/* Social Links */}
              <div className="flex items-center gap-3 mb-6">
                <a href="#" className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-foreground/50 hover:text-foreground hover:bg-white/10 transition-colors">
                  <Twitter className="w-4 h-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-foreground/50 hover:text-foreground hover:bg-white/10 transition-colors">
                  <Linkedin className="w-4 h-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-foreground/50 hover:text-foreground hover:bg-white/10 transition-colors">
                  <Github className="w-4 h-4" />
                </a>
              </div>

              <GoogleSignInButton variant="footer" />
            </div>

            {/* Link Columns */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="text-sm text-foreground/50 hover:text-foreground transition-colors">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-4">Resources</h4>
              <ul className="space-y-3">
                {footerLinks.resources.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="text-sm text-foreground/50 hover:text-foreground transition-colors">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="text-sm text-foreground/50 hover:text-foreground transition-colors">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-4">Support</h4>
              <ul className="space-y-3">
                {footerLinks.support.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="text-sm text-foreground/50 hover:text-foreground transition-colors">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8">
            <p className="text-sm text-foreground/40">
              © {new Date().getFullYear()} Synth. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-foreground/40 hover:text-foreground transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-sm text-foreground/40 hover:text-foreground transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-foreground/40 hover:text-foreground transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default NewFooterSection;




